import pandas as pd
import numpy as np
import sys

def process(filename, field, only):
    data = pd.read_csv(filename)

    def getIDKey():
        for f in [f'Número {field.lower()}', field]:
            if f in data.keys():
                return f

    if only:
        [f, value] = only.split('=')
        only_value = data[f]==value
        data = data[only_value]

    filtred = data.groupby(field).agg(
        {
            'Inscritos': 'sum',
            'CC': 'sum',
            'FPV': 'sum',
            'MTS': 'sum',
            'UCS': 'sum',
            'MAS - IPSP': 'sum',
            '21F': 'sum',
            'PDC': 'sum',
            'MNR': 'sum',
            'PAN-BOL': 'sum',
            'Votos Válidos': 'sum',
            'Blancos': 'sum',
            'Nulos': 'sum',
        }
    )

    filtred.to_csv(sys.stdout)

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='filter CSV by field')
    parser.add_argument('filename', metavar='file_name',
                        type=str, nargs='+', help='CSV source filenames')
    parser.add_argument('--field', default='Municipio', type=str, help='Field to agregate on')
    parser.add_argument('--only', default=None, type=str, help='filter fields')
    args = parser.parse_args()

    for f in args.filename:
        process(f, args.field, args.only)
