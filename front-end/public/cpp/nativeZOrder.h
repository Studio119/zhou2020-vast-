#ifndef NATIVEZORDER_H
#define NATIVEZORDER_H

#include <iostream>
#include <vector>
#include <math.h>
#include <memory>
#include <algorithm>
#include <string>
#include <time.h>
#include "Z_Score.h"
using std::string;
using std::cin;
using std::cout;
using std::endl;
using std::to_string;
using std::unique_ptr;
using std::vector;


enum class LISAtype {
    HH, LH, LL, HL
};


uint16_t toInt16(string str);


class HashSampler {
public:
    struct Z_Point {
        Z_Point(
            const LISAtype& type,
            const uint16_t& hashCode,
            const double& mx,
            const uint16_t& count
        ): type(type), hashCode(hashCode), mx(mx), index(count) {}
        Z_Point(const Z_Point& copy): type(copy.type), hashCode(copy.hashCode), mx(copy.mx), index(copy.index) {}
        uint16_t index;
        LISAtype type;
        uint16_t hashCode;
        double mx;
    };
private:
    unsigned short hashPrecision;
    unique_ptr< vector< vector<HashSampler::Z_Point> > > data;
    uint16_t geoHash(float lat, float lng);
public:
    HashSampler(unsigned short hashPrecision);
    ~HashSampler();
    const HashSampler::Z_Point& get(uint16_t index);
    void loadFromJSON();
    void print();
    void reshape(int n);
    unique_ptr< vector<uint16_t> > sample();
    int size();
};


bool comp(const HashSampler::Z_Point& a, const HashSampler::Z_Point& b);
bool sortById(const HashSampler::Z_Point& a, const HashSampler::Z_Point& b);


HashSampler::HashSampler(unsigned short hashPrecision) {
    this->data = nullptr;
    this->data.reset(new vector< vector<HashSampler::Z_Point> >());
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
    this->data.reset(new vector< vector<HashSampler::Z_Point> >());
    this->data->push_back(vector<HashSampler::Z_Point>());
    
    char c;
    scanf("%c", &c);
    char prev;

    string str = "";

    LISAtype type;
    double lng;
    double lat;
    double mx;

    uint16_t id;

    enum class ATTR {
        id, type, lng, lat, value, mx, my, neighbors
    };
    ATTR flag = ATTR::id;

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
                (*(this->data))[0].push_back(HashSampler::Z_Point(
                    type, this->geoHash(lat, lng), mx, id
                ));
                str = "";
                flag = ATTR::id;
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
            case ATTR::id:
                id = toInt16(str);
                flag = ATTR::type;
                break;
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

uint16_t toInt16(string str) {
    uint16_t num = 0;

    for (int i = 0; i < str.length(); i++) {
        const unsigned short n = str[i] - '0';
        num = num * 10 + n;
    }

    return num;
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

const HashSampler::Z_Point& HashSampler::get(uint16_t index) {
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
    unique_ptr< vector<HashSampler::Z_Point> > all(new vector<HashSampler::Z_Point>());

    for (int e = 0; e < this->data->size(); e++) {
        for (int i = 0; i < (*(this->data))[e].size(); i++) {
            all->push_back((*(this->data))[e][i]);
        }
        (*(this->data))[e].clear();
    }

    this->data = nullptr;
    this->data.reset(new vector< vector<HashSampler::Z_Point> >());

    for (int k = 0; k < n; k++) {
        this->data->push_back(vector<HashSampler::Z_Point>());
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

unique_ptr< vector<uint16_t> > HashSampler::sample() {
    unique_ptr< vector<uint16_t> > vect(new vector<uint16_t>());

    for (int i = 0; i < this->data->size(); i++) {
        const uint16_t index = double(rand()) * double((*(this->data))[i].size()) / RAND_MAX;
        vect->push_back((*(this->data))[i][index].index);
    }

    return vect;
}

bool comp(const HashSampler::Z_Point& a, const HashSampler::Z_Point& b) {
    return a.hashCode < b.hashCode;
}

bool sortById(const HashSampler::Z_Point& a, const HashSampler::Z_Point& b) {
    return a.index < b.index;
}


#endif
