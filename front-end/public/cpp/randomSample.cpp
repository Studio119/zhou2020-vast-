#include <vector>
#include <memory>
#include "Z_Score.h"
#include <stdlib.h>
#include <time.h>

using std::unique_ptr;
using std::vector;


int main(int argc, char const *argv[]) {
    // argc = 2
    // argv[1] 即采样率
    const double rate = toDouble(argv[1]);
    
    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV();

    // 重置种子
    srand(time(NULL));

    // unique_ptr<Z_Score> z_score(new Z_Score(8));

    // 所有的索引
    unique_ptr< vector<int> > box(new vector<int>);
    for (int i = 0; i < ptr_origin->size(); i++) {
        box->push_back(i);
    }

    // 采样量，四舍五入
    const int nSample = rate * double(box->size()) + 0.5;

    unique_ptr< vector<int> > list(new vector<int>);

    for (int i = 0; i < nSample; i ++) {
        const int index = double(rand()) / double(RAND_MAX) * box->size();
        list->push_back((*box)[index]);
        box->erase(box->begin() + index);
    }

    box = nullptr;

    sample(*ptr_origin, *list);

    list = nullptr;

    // // 计算 Z_Score
    // z_score->fit(*ptr_origin);

    cout << "[";

    for (vector<Point>::iterator iter = ptr_origin->begin(); iter < ptr_origin->end(); iter++) {
        if (iter > ptr_origin->begin()) {
            cout << ",\n";
        }

        cout << "{"
            << "\"id\": " << iter->id << ", "
            << "\"type\": \"" << "undefined" << "\", ";
        cout << "\"lng\": " << setprecision(8) << iter->lng << ", ";
        cout << "\"lat\": " << setprecision(8) << iter->lat << ", ";
        cout << "\"value\": " << setprecision(8) << iter->value << ", ";
        cout << "\"mx\": " << setprecision(12) << 0 << ", ";
        cout << "\"my\": " << setprecision(12) << 0 << ", ";
        cout
            << "\"neighbors\": " << "[]"
        << "}";
    }

    cout << "]";

    ptr_origin = nullptr;
    // z_score = nullptr;

    return 0;
}
