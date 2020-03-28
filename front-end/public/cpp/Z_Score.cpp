#include <iostream>
#include <vector>
#include <memory>
#include <math.h>
#include <algorithm>
using namespace std;

const unsigned short int CHAR_COMMA = 44;
const unsigned short int CHAR_NEWLINE = 10;
const float PI = 3.1415926535;

struct Point {
    Point(float lat, float lng, float value) {
        this->lat = lat;
        this->lng = lng;
        this->value = value;
    }
    float lat;
    float lng;
    float value;
};

struct Neighbor {
    Neighbor() {}
    Neighbor(unsigned int index, float value, float weight) {
        this->index = index;
        this->value = value;
        this->weight = weight;
    }
    bool operator>(const Neighbor& b) const {   
       return this->weight < b.weight; 
    }
    bool operator<(const Neighbor& b) const {   
       return this->weight > b.weight; 
    }
    unsigned int index;
    float value;
    float weight;
};

float toFloat(string str);
string toString(const unsigned int* list, unsigned int len);
unique_ptr< vector<Point> > loadFromCSV();

class Z_Score {
private:
    /* 考虑的邻近点的数量 */
    unsigned short int k = k;
    /* 数据长度 */
    unsigned int length;
    /* 每个点选取的邻近点的索引列表 */
    unsigned int** neighbors;
    /* Z 得分 */
    float** score;
    /* 计算两点距离 */
    static float diff(const Point& a, const Point& b) {
        float lng1 = a.lng / 180.0 * PI;
        float lng2 = b.lng / 180.0 * PI;
        float lat1 = a.lat / 180.0 * PI;
        float lat2 = b.lat / 180.0 * PI;
        float e = pow(sin((lat2 - lat1) / 2), 2)
                    + cos(lat1) * cos(lat2) * pow(sin((lng2 - lng1) / 2), 2);
        return 2 * asin(sqrt(e)) * 6.371;
    }
public:
    /* 构造一个 Z_Score 实例 */
    Z_Score(unsigned short int k) {
        this->k = k;
        this->length = 0;
        this->neighbors = nullptr;
        this->score = nullptr;
    }
    /* 释放资源 */
    void reset() {
        for (int i = 0; i < this->length; i++) {
            delete[] this->neighbors[i];
            delete[] this->score[i];
        }
        delete[] this->neighbors;
        delete[] this->score;
        this->neighbors = nullptr;
        this->score = nullptr;
        this->length = 0;
    }
    /* 生成邻近点矩阵 */
    const Z_Score* fit(const vector<Point>& vect) {
        // 重置 Z 得分和邻近点矩阵
        this->reset();
        // 更新数据点的数量
        this->length = vect.size();

        if (this->length == 0) {
            return this;
        }

        /* 标准化属性值列表 */
        float* val = new float[this->length];
        /* 全局属性值均值 */
        float mean = 0;
        /* 全局属性值标准差 */
        float std = 0;

        for (int i = 0; i < this->length; i++) {
            val[i] = vect[i].value;
            mean += vect[i].value;
        }
        mean /= this->length;

        for (int i = 0; i < this->length; i++) {
            std += pow(val[i] - mean, 2);
        }
        std = sqrt(std / (this->length - 1));

        for (int i = 0; i < this->length; i++) {
            val[i] = (val[i] - mean) / std;
        }

        this->neighbors = new unsigned int*[this->length];
        this->score = new float*[this->length];

        cout << "[";

        // 遍历，时间复杂度 O(n^2)
        for (int i = 0; i < this->length; i++) {
            const Point a = Point({
                vect[i].lat, vect[i].lng, val[i]
            });
            /* 按距离升序排列的其他点 */
            vector<Neighbor>* order = new vector<Neighbor>();
            // 遍历其他点，时间复杂度 O(n)
            for (unsigned int j = 0; j < this->length; j++) { 
                if (j == i) {
                    continue;
                }
                const Point b = Point({
                    vect[j].lat, vect[j].lng, val[j]
                });
                /* 两点距离 */
                float dist = diff(a, b);
                order->push_back(Neighbor({
                    j, b.value, float(1.0 / dist)
                }));
                sort(order->begin(), order->end());
                if (order->size() > this->k) {
                    order->resize(this->k);
                }
            }
            this->neighbors[i] = new unsigned int[this->k];
            /* 邻近点空间权重列向量 */
            float* weights = new float[this->k];
            /* 邻近点值列向量 */
            float* values = new float[this->k];
            /* 权重和 */
            float sum = 0;
            for (int p = 0; p < this->k; p++) {
                const Neighbor neighbor = (*order)[p];
                this->neighbors[i][p] = neighbor.index;
                weights[p] = neighbor.weight;
                sum += neighbor.weight;
                values[p] = neighbor.value;
            }
            delete order;
            order = nullptr;
            /* 标准化观测值 */
            const float x = a.value;
            /* 空间滞后值 */
            float lag = 0;
            // 权重归一化，计算空间滞后值
            for (int p = 0; p < this->k; p++) {
                weights[p] /= sum;
                lag += values[p] * weights[p] / sum;
            }
            // 存储结果
            this->score[i] = new float[2];
            this->score[i][0] = x;
            this->score[i][1] = lag;
            delete[] weights;
            delete[] values;

            if (i) {
                cout << ",\n";
            }

            cout << "{"
                << "\"type\": \"" << this->typeIdx(i) << "\", "
                << "\"lng\": " << vect[i].lng << ", "
                << "\"lat\": " << vect[i].lat << ", "
                << "\"value\": " << vect[i].value << ", "
                << "\"mx\": " << this->stdIdx(i) << ", "
                << "\"my\": " << this->lagIdx(i) << ", "
                << "\"neighbors\": " << toString(this->neighborIdx(i), 10)
            << "}";
        }
        delete[] val;

        cout << "]\n";

        return this;
    }
    /* 判断给定索引对应的数据点的类别 */
    const string typeIdx(unsigned int index) {
        return (
            this->score[index][0] < 0 ? "L" : "H"
        ) + string(
            this->score[index][1] < 0 ? "L" : "H"
        );
    }
    /* 返回指定点的邻接点索引 */
    const unsigned int* neighborIdx(unsigned int index) {
        return this->neighbors[index];
    }
    /* 返回指定点的标准化观测值 */
    const float stdIdx(unsigned int index) {
        return this->score[index][0];
    }
    /* 返回指定点的空间滞后值 */
    const float lagIdx(unsigned int index) {
        return this->score[index][1];
    }
};


int main(int argc, char const *argv[]) {
    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV();

    unique_ptr<Z_Score> z_score(new Z_Score(10));

    // 计算 Z_Score
    z_score->fit(*ptr_origin);

    // cout << "[";

    // for (int i = 0; i < ptr_origin->size(); i++) {
    //     if (i) {
    //         cout << ",\n";
    //     }
    //     const Point p = (*ptr_origin)[i];
    //     cout << "{"
    //         << "\"type\": \"" << z_score->typeIdx(i) << "\", "
    //         << "\"lng\": " << p.lng << ", "
    //         << "\"lat\": " << p.lat << ", "
    //         << "\"value\": " << p.value << ", "
    //         << "\"mx\": " << z_score->stdIdx(i) << ", "
    //         << "\"my\": " << z_score->lagIdx(i) << ", "
    //         << "\"neighbors\": " << toString(z_score->neighborIdx(i), 10)
    //     << "}";
    // }

    // cout << "]";

    ptr_origin = nullptr;
    z_score = nullptr;

    return 0;
}


unique_ptr< vector<Point> > loadFromCSV() {
    unique_ptr< vector<Point> > ptr_vect(new vector<Point>());

    char c;
    scanf("%c", &c);
    char prev;

    string str = "";

    float lat;
    float lng;

    enum class ATTR {
        LAT, LNG, VALUE
    };
    ATTR flag = ATTR::LAT;

    while (c != CHAR_NEWLINE || prev != CHAR_NEWLINE) {
        if (c == CHAR_COMMA) {
            switch (flag) {
            case ATTR::LAT:
                lat = toFloat(str);
                str = "";
                flag = ATTR::LNG;
                break;
            case ATTR::LNG:
                lng = toFloat(str);
                str = "";
                flag = ATTR::VALUE;
                break;
            }
        } else if (c == CHAR_NEWLINE) {
            ptr_vect->push_back(Point({
                lat, lng, toFloat(str)
            }));
            str = "";
            flag = ATTR::LAT;
        } else {
            str += c;
        }
        prev = c;
        scanf("%c", &c);
    }

    return ptr_vect;
}

float toFloat(string str) {
    float num = 0;
    short digit = -1;
    int i = str[0] == '-' ? 1 : 0;
    short flag = str[0] == '-' ? -1 : 1;

    for (; i < str.length(); i++) {
        if (str[i] == '.') {
            digit = 0;
        } else {
            const unsigned short n = str[i] - '0';
            num = num * 10 + n;
            if (digit > -1) {
                digit++;
            }
        }
    }

    while (digit--) {
        num /= 10.0;
    }

    return flag * num;
}

string toString(const unsigned int* list, unsigned int len) {
    string str = "[";
    for (int i = 0; i < len - 2; i++) {
        str += to_string(list[i]) + ", ";
    }
    str += to_string(list[len - 1]);
    return str + "]";
}
