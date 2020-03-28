#include <iostream>
#include <vector>
#include <memory>
using std::string;
using std::cin;
using std::cout;
using std::to_string;
using std::endl;
using std::unique_ptr;
using std::vector;

const unsigned short int CHAR_COMMA = 44;
const unsigned short int CHAR_NEWLINE = 10;

enum class State {
    ready, sampled, banned
};

struct Point {
    Point(unsigned int id, float lat, float lng, float value) {
        this->id = id;
        this->lat = lat;
        this->lng = lng;
        this->value = value;
        this->state = State::ready;
    }
    unsigned int id;    // 原始的编号
    float lat;          // 纬度
    float lng;          // 经度
    float value;        // 值
    State state;        // 状态
};

unique_ptr< vector<Point> > loadFromCSV();
float toFloat(string str);
string stringify(vector<Point> vect);

class BNS {
private:
    unique_ptr< vector<Point> > ptr_data;
public:
    BNS() {
        ptr_data = nullptr;
    }
};

int main() {
    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV();

    cout << stringify(*ptr_origin) << endl;

    ptr_origin = nullptr;

    return 0;
}

string stringify(vector<Point> vect) {
    string str = "";

    str += "[";

    for (int i = 0; i < vect.size(); i++) {
        if (i) {
            str += ",\n";
        }
        const Point p = vect[i];
        str += "{\"id\": " + to_string(p.id)
                + ", \"lat\": " + to_string(p.lat)
                + ", \"lng\": " + to_string(p.lng)
                + ", \"value\": " + to_string(p.value)
                + ", \"state\": " + (
                    p.state == State::ready ? "\"ready\""
                        : p.state == State::sampled ? "\"sampled\""
                            : "\"banned\""
                )
                + "}";
    }

    str += "]";

    return str;
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

    unsigned int t = 0;

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
                t++, lat, lng, toFloat(str)
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
