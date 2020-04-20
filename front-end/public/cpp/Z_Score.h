#ifndef Z_SCORE_H
#define Z_SCORE_H

#include <iostream>
#include <vector>
#include <memory>
#include <string>
#include <math.h>
#include <algorithm>
#include <fstream>
#include <iomanip>

using std::cout;
using std::string;
using std::to_string;
using std::unique_ptr;
using std::vector;
using std::sort;
using std::ifstream;
using std::ofstream;
using std::setprecision;


// 常量定义
const unsigned short int CHAR_COMMA = 44;
const unsigned short int CHAR_NEWLINE = 10;
const double PI = 3.1415926535;


// 数据点信息
struct Point {
    Point(int id, double lat, double lng, double value);
    int id;
    double lat;
    double lng;
    double value;
};

Point::Point(int id, double lat, double lng, double value) {
    this->id = id;
    this->lat = lat;
    this->lng = lng;
    this->value = value;
}


// 邻近点记录
struct Neighbor {
    Neighbor();
    Neighbor(unsigned int index, double value, double weight);
    bool operator>(const Neighbor& b) const;
    bool operator<(const Neighbor& b) const;
    unsigned int index;
    double value;
    double weight;
};

Neighbor::Neighbor() {}

Neighbor::Neighbor(unsigned int index, double value, double weight) {
    this->index = index;
    this->value = value;
    this->weight = weight;
}

bool Neighbor::operator>(const Neighbor& b) const {   
    return this->weight < b.weight; 
}

bool Neighbor::operator<(const Neighbor& b) const {   
    return this->weight > b.weight; 
}


// 工具函数声明
double toDouble(string str);
string toString(const unsigned int* list, unsigned int len);
unique_ptr< vector<Point> > loadFromCSV();
unique_ptr< vector<Point> > loadFromCSV(string path);
void sample(vector<Point>& vect, vector<int>& indexList);
void sample(vector<Point>& vect, vector<uint16_t>& indexList);


// 算法类
class Z_Score {
private:
    /* 考虑的邻近点的数量 */
    unsigned short int k = k;
    /* 数据长度 */
    unsigned int length;
    /* 每个点选取的邻近点的索引列表 */
    unsigned int** neighbors;
    /* Z 得分 */
    double** score;
    /* 计算两点距离 */
    static double diff(const Point& a, const Point& b);
public:
    /* 构造一个 Z_Score 实例 */
    Z_Score(unsigned short int k);
    ~Z_Score();
    /* 释放资源 */
    void reset();
    /* 生成邻近点矩阵 */
    const Z_Score* fit(const vector<Point>& vect);
    const Z_Score* fit(const vector<Point>& vect, const string& output);
    /* 判断给定索引对应的数据点的类别 */
    const string typeIdx(unsigned int index);
    /* 返回指定点的邻接点索引 */
    const unsigned int* neighborIdx(unsigned int index);
    /* 返回指定点的标准化观测值 */
    const double stdIdx(unsigned int index);
    /* 返回指定点的空间滞后值 */
    const double lagIdx(unsigned int index);
};

double Z_Score::diff(const Point& a, const Point& b) {
    return sqrt(pow(a.lng - b.lng, 2) + pow(a.lat - b.lat, 2));
    // double lng1 = a.lng / 180.0 * PI;
    // double lng2 = b.lng / 180.0 * PI;
    // double lat1 = a.lat / 180.0 * PI;
    // double lat2 = b.lat / 180.0 * PI;
    // double e = pow(sin((lat2 - lat1) / 2), 2)
    //             + cos(lat1) * cos(lat2) * pow(sin((lng2 - lng1) / 2), 2);
    // return 2 * asin(sqrt(e)) * 6.371;
}

Z_Score::Z_Score(unsigned short int k) {
    this->k = k;
    this->length = 0;
    this->neighbors = nullptr;
    this->score = nullptr;
}

Z_Score::~Z_Score() {
    this->reset();
}

void Z_Score::reset() {
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

const Z_Score* Z_Score::fit(const vector<Point>& vect) {
    // 重置 Z 得分和邻近点矩阵
    this->reset();
    // 更新数据点的数量
    this->length = vect.size();

    if (this->length == 0) {
        return this;
    }

    /* 标准化属性值列表 */
    double* val = new double[this->length];
    /* 全局属性值均值 */
    double mean = 0;
    /* 全局属性值标准差 */
    double std = 0;

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
    this->score = new double*[this->length];

    cout << "[";

    // 遍历，时间复杂度 O(n^2)
    for (int i = 0; i < this->length; i++) {
        const Point a = Point({
            vect[i].id, vect[i].lat, vect[i].lng, val[i]
        });
        /* 按距离升序排列的其他点 */
        vector<Neighbor>* order = new vector<Neighbor>();
        // 遍历其他点，时间复杂度 O(n)
        for (unsigned int j = 0; j < this->length; j++) { 
            if (j == i) {
                continue;
            }
            const Point b = Point({
                vect[j].id, vect[j].lat, vect[j].lng, val[j]
            });
            /* 两点距离 */
            double dist = diff(a, b);
            order->push_back(Neighbor({
                j, b.value, double(1.0 / dist)
            }));
            sort(order->begin(), order->end());
            if (order->size() > this->k) {
                order->resize(this->k);
            }
        }
        this->neighbors[i] = new unsigned int[this->k];
        /* 邻近点空间权重列向量 */
        double* weights = new double[this->k];
        /* 邻近点值列向量 */
        double* values = new double[this->k];
        /* 权重和 */
        double sum = 0;
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
        const double x = a.value;
        /* 空间滞后值 */
        double lag = 0;
        // 权重归一化，计算空间滞后值
        for (int p = 0; p < this->k; p++) {
            weights[p] /= sum;
            lag += values[p] * weights[p];
        }
        // 存储结果
        this->score[i] = new double[2];
        this->score[i][0] = x;
        this->score[i][1] = lag;
        delete[] weights;
        delete[] values;

        if (i) {
            cout << ",\n";
        }

        cout << "{"
            << "\"id\": " << vect[i].id << ", "
            << "\"type\": \"" << this->typeIdx(i) << "\", ";
        printf("\"lng\": %lf, ", vect[i].lng);
        printf("\"lat\": %lf, ", vect[i].lat);
        printf("\"value\": %lf, ", vect[i].value);
        printf("\"mx\": %lf, ", this->stdIdx(i));
        printf("\"my\": %lf, ", this->lagIdx(i));
        cout
            << "\"neighbors\": " << toString(this->neighborIdx(i), this->k)
        << "}";
    }
    delete[] val;

    cout << "]\n";

    return this;
}

const Z_Score* Z_Score::fit(const vector<Point>& vect, const string& output) {
    ofstream fout;
    fout.open(output);
    if (!fout.is_open()) {
        exit(-1);
    }

    // 重置 Z 得分和邻近点矩阵
    this->reset();
    // 更新数据点的数量
    this->length = vect.size();

    if (this->length == 0) {
        return this;
    }

    /* 标准化属性值列表 */
    double* val = new double[this->length];
    /* 全局属性值均值 */
    double mean = 0;
    /* 全局属性值标准差 */
    double std = 0;

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
    this->score = new double*[this->length];

    fout << "[";

    // 遍历，时间复杂度 O(n^2)
    for (int i = 0; i < this->length; i++) {
        const Point a = Point({
            vect[i].id, vect[i].lat, vect[i].lng, val[i]
        });
        /* 按距离升序排列的其他点 */
        vector<Neighbor>* order = new vector<Neighbor>();
        // 遍历其他点，时间复杂度 O(n)
        for (unsigned int j = 0; j < this->length; j++) { 
            if (j == i) {
                continue;
            }
            const Point b = Point({
                vect[j].id, vect[j].lat, vect[j].lng, val[j]
            });
            /* 两点距离 */
            double dist = diff(a, b);
            order->push_back(Neighbor({
                j, b.value, double(1.0 / dist)
            }));
            sort(order->begin(), order->end());
            if (order->size() > this->k) {
                order->resize(this->k);
            }
        }
        this->neighbors[i] = new unsigned int[this->k];
        /* 邻近点空间权重列向量 */
        double* weights = new double[this->k];
        /* 邻近点值列向量 */
        double* values = new double[this->k];
        /* 权重和 */
        double sum = 0;
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
        const double x = a.value;
        /* 空间滞后值 */
        double lag = 0;
        // 权重归一化，计算空间滞后值
        for (int p = 0; p < this->k; p++) {
            weights[p] /= sum;
            lag += values[p] * weights[p];
        }
        // 存储结果
        this->score[i] = new double[2];
        this->score[i][0] = x;
        this->score[i][1] = lag;
        delete[] weights;
        delete[] values;

        if (i) {
            fout << ",\n";
        }

        fout << "{"
            << "\"id\": " << vect[i].id << ", "
            << "\"type\": \"" << this->typeIdx(i) << "\", ";
        fout << "\"lng\": " << setprecision(8) << vect[i].lng << ", ";
        fout << "\"lat\": " << setprecision(8) << vect[i].lat << ", ";
        fout << "\"value\": " << setprecision(8) << vect[i].value << ", ";
        fout << "\"mx\": " << setprecision(12) << this->stdIdx(i) << ", ";
        fout << "\"my\": " << setprecision(12) << this->lagIdx(i) << ", ";
        fout
            << "\"neighbors\": " << toString(this->neighborIdx(i), this->k)
        << "}";
    }
    delete[] val;

    fout << "]\n";

    fout.close();

    return this;
}

const string Z_Score::typeIdx(unsigned int index) {
    return (
        this->score[index][0] < 0 ? "L" : "H"
    ) + string(
        this->score[index][1] < 0 ? "L" : "H"
    );
}

const unsigned int* Z_Score::neighborIdx(unsigned int index) {
    return this->neighbors[index];
}

const double Z_Score::stdIdx(unsigned int index) {
    const double x = this->score[index][0];
    return isnan(x) ? 0 : x;
}

const double Z_Score::lagIdx(unsigned int index) {
    const double y = this->score[index][1];
    return isnan(y) ? 0 : y;
}


unique_ptr< vector<Point> > loadFromCSV() {
    unique_ptr< vector<Point> > ptr_vect(new vector<Point>());

    char c;
    scanf("%c", &c);
    char prev;

    string str = "";

    double lat;
    double lng;

    enum class ATTR {
        LAT, LNG, VALUE
    };
    ATTR flag = ATTR::LAT;

    while (c != CHAR_NEWLINE || prev != CHAR_NEWLINE) {
        if (c == CHAR_COMMA) {
            switch (flag) {
            case ATTR::LAT:
                lat = toDouble(str);
                str = "";
                flag = ATTR::LNG;
                break;
            case ATTR::LNG:
                lng = toDouble(str);
                str = "";
                flag = ATTR::VALUE;
                break;
            }
        } else if (c == CHAR_NEWLINE) {
            ptr_vect->push_back(Point({
                int(ptr_vect->size()), lat, lng, toDouble(str)
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

unique_ptr< vector<Point> > loadFromCSV(string path) {
    ifstream fin;

    fin.open(path);

    if (!fin.is_open()) {
        return nullptr;
    }

    unique_ptr< vector<Point> > ptr_vect(new vector<Point>());

    char c = fin.get();

    string str = "";

    double lat;
    double lng;

    enum class ATTR {
        LAT, LNG, VALUE
    };
    ATTR flag = ATTR::LAT;

    while (c != EOF) {
        if (c == CHAR_COMMA) {
            switch (flag) {
            case ATTR::LAT:
                lat = toDouble(str);
                str = "";
                flag = ATTR::LNG;
                break;
            case ATTR::LNG:
                lng = toDouble(str);
                str = "";
                flag = ATTR::VALUE;
                break;
            }
        } else if (c == CHAR_NEWLINE) {
            ptr_vect->push_back(Point({
                int(ptr_vect->size()), lat, lng, toDouble(str)
            }));
            str = "";
            flag = ATTR::LAT;
        } else {
            str += c;
        }
        c = fin.get();
    }

    fin.close();

    return ptr_vect;
}

double toDouble(string str) {
    double num = 0;
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
    for (int i = 0; i <= len - 2; i++) {
        str += to_string(list[i]) + ", ";
    }
    str += to_string(list[len - 1]);
    return str + "]";
}

void sample(vector<Point>& vect, vector<int>& indexList) {
    unique_ptr< vector<Point> > samples(new vector<Point>(vect));

    vect.clear();

    sort(indexList.begin(), indexList.end());

    for (int i = 0; i < indexList.size(); i++) {
        vect.push_back((*samples)[indexList[i]]);
    }

    samples->clear();

    samples = nullptr;
}

void sample(vector<Point>& vect, vector<uint16_t>& indexList) {
    unique_ptr< vector<Point> > samples(new vector<Point>(vect));

    vect.clear();

    sort(indexList.begin(), indexList.end());

    for (int i = 0; i < indexList.size(); i++) {
        vect.push_back((*samples)[indexList[i]]);
    }

    samples->clear();

    samples = nullptr;
}

#endif
