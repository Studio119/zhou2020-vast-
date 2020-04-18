#include "Z_Score.h"
#include "nativeZOrder.h"


int main(int argc, char const *argv[]) {
    // argc = 3
    // argv[1] 即采样率
    const double rate = toDouble(argv[1]);
    // argv[2] 为 csv 文件名
    const string path = argv[2];

    // 重置种子
    srand(time(NULL));

    // 读取 csv 文件
    unique_ptr< vector<Point> > ptr_origin = loadFromCSV(path);

    unique_ptr<HashSampler> hs(new HashSampler(32));

    hs->loadFromJSON();

    // 采样量，四舍五入
    const int nSample = rate * double(hs->size()) + 0.5;

    hs->reshape(nSample);

    hs->write("../storage/zorder_temp.json");

    unique_ptr< vector<uint16_t> > res = hs->sample();

    sample(*ptr_origin, *res);

    // 计算 Z_Score
    unique_ptr<Z_Score> z_score(new Z_Score(8));
    z_score->fit(*ptr_origin);
    
    hs = nullptr;
    res = nullptr;
    z_score = nullptr;
    
    return 0;
}
