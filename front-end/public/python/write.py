#!/usr/bin/env python3
import sys

if __name__ == "__main__":
    with open("../../../back-end/temp_input.json", mode='w', encoding='utf8') as f:
        f.write(sys.argv[1])
        pass
    pass
