#include <vector>
#include <fstream>
#include <memory>
#include "Z_Score.h"

using std::unique_ptr;
using std::vector;
using std::ifstream;
using std::ofstream;


uint16_t toInt16(string str);
unique_ptr< vector<uint16_t> > getJSON(const string& filename, const uint16_t& ed, const uint16_t& er);


int main(int argc, char const *argv[]) {
    // argc = 4
    // argv[1]  替换前 id
    // argv[2]  替换后 id
    // argv[3]  采样 _o.json 文件
    // stdin    .csv 文件
    // file out 采样 _o.json 文件

    const string filename = argv[3];
    const uint16_t indexEd = toInt16(argv[1]);
    const uint16_t indexEr = toInt16(argv[2]);
    
    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV();

    unique_ptr<Z_Score> z_score(new Z_Score(8));

    // 索引
    unique_ptr< vector<uint16_t> > box = getJSON(filename, indexEd, indexEr);

    sample(*ptr_origin, *box);

    box = nullptr;

    // 计算 Z_Score
    z_score->fit(*ptr_origin, filename);

    ptr_origin = nullptr;
    z_score = nullptr;

    return 0;
}


uint16_t toInt16(string str) {
    uint16_t num = 0;

    for (int i = 0; i < str.length(); i++) {
        const unsigned short n = str[i] - '0';
        num = num * 10 + n;
    }

    return num;
}

unique_ptr< vector<uint16_t> > getJSON(const string& filename, const uint16_t& ed, const uint16_t& er) {
    ifstream fin;
    fin.open(filename);

    if (!fin.is_open()) {
        exit(-1);
    }

    unique_ptr< vector<uint16_t> > list(new vector<uint16_t>());

    char c = fin.get();
    char prev;

    string str = "";

    uint16_t id;

    enum class ATTR {
        id, type, lng, lat, value, mx, my, neighbors
    };

    ATTR flag = ATTR::id;

    while (!fin.eof()) {
        if (c == ':') {
            str = "";
            prev = c;
            c = fin.get();
            continue;
        } else if (c == '"') {
            prev = c;
            c = fin.get();
            continue;
        }
        if (flag == ATTR::neighbors) {
            if (c == '}' && prev == ']') {
                list->push_back(id);
                str = "";
                flag = ATTR::id;
                do {
                    prev = c;
                    c = fin.get();
                } while (c == ',' || c == '\n');
            }
            prev = c;
            c = fin.get();
            continue;
        } else if (c == '[' || c == ']' || c == '{' || c == '}' || c == ' ') {
            prev = c;
            c = fin.get();
            continue;
        } else if (c == ',') {
            switch (flag) {
            case ATTR::id:
                id = toInt16(str);
                if (id == ed) {
                    id = er;
                }
                flag = ATTR::type;
                break;
            case ATTR::type:
                str = "";
                flag = ATTR::lng;
                break;
            case ATTR::lng:
                str = "";
                flag = ATTR::lat;
                break;
            case ATTR::lat:
                str = "";
                flag = ATTR::value;
                break;
            case ATTR::value:
                str = "";
                flag = ATTR::mx;
                break;
            case ATTR::mx:
                str = "";
                flag = ATTR::my;
                break;
            case ATTR::my:
                str = "";
                flag = ATTR::neighbors;
                break;
            }
        } else {
            str += c;
        }
        c = fin.get();
    }

    fin.close();

    return list;
}
