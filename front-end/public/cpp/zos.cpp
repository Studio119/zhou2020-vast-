#include <iostream>
#include <vector>
#include <math.h>
#include <memory>
#include <algorithm>
#include <time.h>
using std::string;
using std::cin;
using std::cout;
using std::endl;
using std::to_string;
using std::unique_ptr;
using std::vector;

#define BORDER 5

enum class LISAtype {
    HH, LH, LL, HL
};

struct Point {
    Point(
        const LISAtype& type,
        const uint16_t& hashCode,
        const double& mx,
        const uint16_t& count
    ): type(type), hashCode(hashCode), mx(mx), index(count) {}
    Point(const Point& copy): type(copy.type), hashCode(copy.hashCode), mx(copy.mx), index(copy.index) {}
    uint16_t index;
    LISAtype type;
    uint16_t hashCode;
    double mx;
};

bool comp(const Point& a, const Point& b);

double toDouble(string str);

class HashSampler {
private:
    unsigned short hashPrecision;
    unique_ptr< vector< vector<Point> > > data;
    uint16_t geoHash(float lat, float lng);
    class Node {
    private:
        bool locked;
        const vector<Point> points;
        vector<Node*> siblings;
        uint16_t target;
    public:
        Node(
            const vector<Point>& points
        ): target(points.size()),
            locked(false),
            points(points),
            siblings(vector<Node*>()) {}
        const Point& getTarget() {
            return this->points[this->target];
        }
        bool isLocked() {
            return this->locked;
        }
        void lock() {
            this->locked = true;
        }
        void neighbor(Node* n) {
            this->siblings.push_back(n);
        }
        void take(uint16_t index) {
            this->target = index;
        }
    };
public:
    HashSampler(unsigned short hashPrecision);
    ~HashSampler();
    const Point& get(uint16_t index);
    void loadFromJSON();
    void print();
    void reshape(int n);
    unique_ptr< vector<Point> > sample();
    int size();
};

int main() {
    unique_ptr<HashSampler> hs(new HashSampler(32));

    hs->loadFromJSON();
    hs->reshape(hs->size() / 5);
    hs->print();

    unique_ptr< vector<Point> > res = hs->sample();

    for (uint16_t i = 0; i < res->size(); i++) {
        cout << (i == 0 ? "[ " : "  ");
        const Point p = (*res)[i];
        string index = to_string(p.index);
        string bsp = "";
        for (int t = index.length(); t < 8; t++) {
            bsp += " ";
        }
        cout << "{  index: " << index << bsp;
        string type = to_string(int(p.type));
        bsp = "";
        for (int t = type.length(); t < 4; t++) {
            bsp += " ";
        }
        cout << "type: " << type << bsp;
        string hashCode = to_string(int(p.hashCode));
        bsp = "";
        for (int t = hashCode.length(); t < 8; t++) {
            bsp += " ";
        }
        cout << "hashCode: " << hashCode << bsp;
        string mx = to_string(p.mx);
        bsp = "";
        for (int t = mx.length(); t < 12; t++) {
            bsp += " ";
        }
        cout << "mx: " << mx << bsp << "}" << (
            i == res->size() - 1
                ? " ]" : ""
        ) << endl;
    }
    
    hs = nullptr;
    res = nullptr;
    
    return 0;
}

HashSampler::HashSampler(unsigned short hashPrecision) {
    this->data = nullptr;
    this->data.reset(new vector< vector<Point> >());
    this->hashPrecision = hashPrecision;
}

HashSampler::~HashSampler() {
    for (int i = 0; i < this->data->size(); i++) {
        (*(this->data))[i].clear();
    }
    this->data = nullptr;
}

void HashSampler::loadFromJSON() {
    for (int i = 0; i < this->data->size(); i++) {
        (*(this->data))[i].clear();
    }
    this->data = nullptr;
    this->data.reset(new vector< vector<Point> >());
    this->data->push_back(vector<Point>());
    
    char c;
    scanf("%c", &c);
    char prev;

    string str = "";

    LISAtype type;
    double lng;
    double lat;
    double mx;

    uint16_t count = 0;

    enum class ATTR {
        type, lng, lat, value, mx, my, neighbors
    };
    ATTR flag = ATTR::type;

    while (c != '\n' || prev != '\n') {
        if (c == ':') {
            str = "";
            prev = c;
            scanf("%c", &c);
            continue;
        } else if (c == '"') {
            prev = c;
            scanf("%c", &c);
            continue;
        }
        if (flag == ATTR::neighbors) {
            if (c == '}' && prev == ']') {
                (*(this->data))[0].push_back(Point(
                    type, this->geoHash(lat, lng), mx, count++
                ));
                str = "";
                flag = ATTR::type;
                do {
                    prev = c;
                    scanf("%c", &c);
                } while (c == ',' || c == '\n');
            }
            prev = c;
            scanf("%c", &c);
            continue;
        } else if (c == '[' || c == ']' || c == '{' || c == '}' || c == ' ') {
            prev = c;
            scanf("%c", &c);
            continue;
        } else if (c == ',') {
            switch (flag) {
            case ATTR::type:
                type = str[0] == 'H'
                    ? str[1] == 'H' ? LISAtype::HH : LISAtype::HL
                    : str[1] == 'H' ? LISAtype::LH : LISAtype::LL;
                str = "";
                flag = ATTR::lng;
                break;
            case ATTR::lng:
                lng = toDouble(str);
                str = "";
                flag = ATTR::lat;
                break;
            case ATTR::lat:
                lat = toDouble(str);
                str = "";
                flag = ATTR::value;
                break;
            case ATTR::value:
                str = "";
                flag = ATTR::mx;
                break;
            case ATTR::mx:
                mx = toDouble(str);
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
        prev = c;
        scanf("%c", &c);
    }

    sort((*(this->data))[0].begin(), (*(this->data))[0].end(), comp);
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

uint16_t HashSampler::geoHash(float lat, float lng) {
    uint16_t code = 0;

    double y = lat + double(90);
    double x = lng + double(180);

    for (int p = 0; p < this->hashPrecision; p++) {
        double dx = double(180) / pow(2, p);
        uint8_t digit = 0;
        if (y >= dx) {
            digit |= 2;
            y -= dx;
        }
        if (x >= dx) {
            digit |= 1;
            x -= dx;
        }
        code = code * 4 + digit;
    }

    return code;
}

void HashSampler::print() {
    for (int e = 0; e < this->data->size(); e++) {
        for (int i = 0; i < (*(this->data))[e].size(); i++) {
            cout << (e == 0 && i == 0 ? "[ " : "  ");
            string index = to_string((*(this->data))[e][i].index);
            string bsp = "";
            for (int t = index.length(); t < 8; t++) {
                bsp += " ";
            }
            cout << "{  index: " << index << bsp;
            string type = to_string(int((*(this->data))[e][i].type));
            bsp = "";
            for (int t = type.length(); t < 4; t++) {
                bsp += " ";
            }
            cout << "type: " << type << bsp;
            string hashCode = to_string(int((*(this->data))[e][i].hashCode));
            bsp = "";
            for (int t = hashCode.length(); t < 8; t++) {
                bsp += " ";
            }
            cout << "hashCode: " << hashCode << bsp;
            string mx = to_string((*(this->data))[e][i].mx);
            bsp = "";
            for (int t = mx.length(); t < 12; t++) {
                bsp += " ";
            }
            cout << "mx: " << mx << bsp << "}" << (
                e == this->data->size() - 1 && i == (*(this->data))[e].size() - 1
                    ? " ]"
                    : i == (*(this->data))[e].size() - 1
                        ? "\n  ..."
                        : ""
            ) << endl;
        }
    }
}

const Point& HashSampler::get(uint16_t index) {
    for (int e = 0; e < this->data->size(); e++) {
        for (int i = 0; i < (*(this->data))[e].size(); i++) {
            if (uint16_t(index) == (*(this->data))[e][i].index) {
                return (*(this->data))[e][i];
            }
        }
    }
    throw "Connot find point with index " + to_string(index);
}

void HashSampler::reshape(int n) {
    unique_ptr< vector<Point> > all(new vector<Point>());

    for (int e = 0; e < this->data->size(); e++) {
        for (int i = 0; i < (*(this->data))[e].size(); i++) {
            all->push_back((*(this->data))[e][i]);
        }
        (*(this->data))[e].clear();
    }

    this->data = nullptr;
    this->data.reset(new vector< vector<Point> >());

    for (int k = 0; k < n; k++) {
        this->data->push_back(vector<Point>());
    }

    const int step = all->size() / n;

    for (int i = 0; i < all->size(); i++) {
        (*(this->data))[i/step].push_back((*all)[i]);
    }

    all = nullptr;
}

int HashSampler::size() {
    int c = 0;
    for (int i = 0; i < this->data->size(); i++) {
        c += (*(this->data))[i].size();
    }

    return c;
}

unique_ptr< vector<Point> > HashSampler::sample() {
    vector<HashSampler::Node> nodes;

    int activeNo = this->data->size();

    for (int i = 0; i < this->data->size(); i++) {
        nodes.push_back(
            HashSampler::Node(
                (*(this->data))[i]
            )
        );
        LISAtype _t = (*(this->data))[i][0].type;
        for (int m = (*(this->data))[i].size() - 1; m >= 0; m--) {
            if (m == 0) {
                // randomly choose one, and lock it
                const uint16_t index = double(rand()) * double((*(this->data))[i].size()) / RAND_MAX;
                nodes[i].take(index);
                nodes[i].lock();
                activeNo--;
            } else if ((*(this->data))[i][m].type != _t) {
                break;
            }
        }
    }

    for (int i = 0; i < this->data->size(); i++) {
        for (int j = i - BORDER; j <= i + BORDER; j++) {
            if (i == j || j < 0 || j >= this->data->size()) {
                continue;
            } else {
                nodes[i].neighbor(&nodes[j]);
            }
        }
    }

    while (activeNo) {
        for (int i = 0; i < this->data->size(); i++) {
            if (nodes[i].isLocked()) {
                continue;
            } else {
                // randomly choose one, and lock it
                const uint16_t index = double(rand()) * double((*(this->data))[i].size()) / RAND_MAX;
                nodes[i].take(index);
                nodes[i].lock();
                activeNo--;
            }
        }
    }

    unique_ptr< vector<Point> > vect(new vector<Point>());

    for (int i = 0; i < nodes.size(); i++) {
        vect->push_back(nodes[i].getTarget());
    }

    return vect;
}

bool comp(const Point& a, const Point& b) {
    return a.hashCode < b.hashCode;
}
