#!/usr/bin/env python
import pandas as pd
import sys

TOTAL_ACTAS=34555

cc = 'CC'
mas = 'MAS - IPSP'
vv = 'Votos Válidos'

def process(f):
    d = pd.read_excel(f)
    only = d['Elección'] == 'Presidente y Vicepresidente'
    d = d[only]
    l = len(d)
    a = d.agg({
        cc: 'sum',
        mas: 'sum',
        vv: 'sum',
    })
    pl = l/TOTAL_ACTAS
    pcc = a[cc]/a[vv]
    pmas = a[mas]/a[vv]
    pdiff = pmas - pcc
    diff = a[mas] - a[cc]
    delta = a[mas] - (pcc + 0.1)*a[vv]

    print(f"{f},{pl},{pcc},{pmas},{pdiff},{l},{a[cc]},{a[mas]},{diff},{delta}")

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

if __name__ == '__main__':
    import argparse
    from progressbar import ProgressBar, Bar, AdaptiveETA, Percentage

    parser = argparse.ArgumentParser(description='get stats about a bolivia 2019 act')
    parser.add_argument('filename', metavar='file_name',
                        type=str, nargs='+', help='xlsx source filenames')
    args = parser.parse_args()

    widgets = [Percentage(),
               ' ', Bar(),
               ' ', AdaptiveETA()]
    pbar = ProgressBar(widgets=widgets, maxval=len(args.filename))
    pbar.start()

    print("file,%_total,%_cc,%_mas,%_diff,total,cc,mas,diff,delta")
    i = 1
    for f in args.filename:
        pbar.update(i)
        if f == '-': f = sys.stdin
        try:
            process(f)
        except:
            eprint(f"error procesing {f}")
        i = i + 1

