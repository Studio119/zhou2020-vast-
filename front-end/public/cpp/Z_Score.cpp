#include <vector>
#include <memory>
#include "Z_Score.h"

using std::unique_ptr;
using std::vector;


int main(int argc, char const *argv[]) {
    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV();

    unique_ptr<Z_Score> z_score(new Z_Score(8));

    // 计算 Z_Score
    z_score->fit(*ptr_origin);

    ptr_origin = nullptr;
    z_score = nullptr;

    return 0;
}
