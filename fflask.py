from flask import Flask
from flask_cors import CORS
import os
import xlrd
import xlwt
import json
from datetime import datetime, timedelta  
import glob

app = Flask(__name__)
CORS(app)


maxLen = 0
# set buy price : last end price (4) or last bottom price (3)
# typeBuy = input('set buy price : last end price (4) or last bottom price (3) :')
typeBuy = 3
# max buy time
maxBuy = 40000000
profitRatePerStock = 1.01
maxLossRate = 1 / 1000
jsonData = []
tradeData = []

def excel_date(date1):
    temp = dt.datetime(1899, 12, 31)    # Note, not 31st Dec but 30th!
    delta = date1 - temp
    return float(delta.days) + (float(delta.seconds) / 86400)

def python_date(number):
    delta = float(number)
    delta = delta * 24 * 3600
    temp = datetime(1899, 12, 30)
    p_d = temp + timedelta(seconds = delta)
    return str(p_d)


@app.route('/')
def hello_world():
    return "Hello World!"

@app.route('/getDataStock/<table>')
def getDataStock(table ='GSYH'):
    workbook = xlrd.open_workbook('table'+ table + '.xlsx')
    sheet1 = workbook.sheet_by_name('Table')
    nrows = sheet1.nrows
    i = 1
    tradeData = []
    while(i < nrows - 1):
        if(table == 'GSYH'):
            tradeData.append({'date': sheet1.cell(i, 0).value.split(',')[0],
                'value': float(sheet1.cell(i, 1).value)})
        else:
            tradeData.append({'date': python_date(sheet1.cell(i, 0).value),
                'value': float(sheet1.cell(i, 1).value)})
        i = i + 1
    return str(tradeData)

@app.route('/getOriginalData/<table>')
def getOriginalData(table ='GSYH'):
    workbook = xlrd.open_workbook('table'+ table + '.xlsx')
    sheet1 = workbook.sheet_by_name('Table')
    nrows = sheet1.nrows
    i = 1
    tradeData = []
    while(i < nrows - 1):
        if(table == 'GSYH'):
            tradeData.append({'date': sheet1.cell(i, 0).value.split(',')[0],
                'open': float(sheet1.cell(i, 1).value),
                'high': float(sheet1.cell(i, 2).value),
                'low': float(sheet1.cell(i, 3).value),
                'close': float(sheet1.cell(i, 4).value)})
        else:
            tradeData.append({'date': python_date(sheet1.cell(i, 0).value),
                'open': float(sheet1.cell(i, 1).value),
                'high': float(sheet1.cell(i, 2).value),
                'low': float(sheet1.cell(i, 3).value),
                'close': float(sheet1.cell(i, 4).value)})
        i = i + 1
    return str(tradeData)



@app.route('/getEggTablesNames/<time>')
def getEggTablesNames(time='60m'):
    arrayTable = glob.glob('JD\\' + time + '\\' + '*.xlsx')
    i = 0
    while(i < len(arrayTable)):
        arrayTable[i] = arrayTable[i].replace('JD\\' + time + '\\', '')
        arrayTable[i] = arrayTable[i].replace('.XDCE' + time + '.xlsx', '')
        if(arrayTable[i][0:2] == '~$'):
            arrayTable.pop(i);
        else:
            i = i + 1
    return str(arrayTable)

@app.route('/getEggTablesData/<time>')
def getEggTablesData(time='60m'):
    arrayTable = glob.glob('JD\\' + time + '\\' + '*.xlsx')
    strReturn = ''
    i = 0
    while(i < len(arrayTable)):
        arrayTable[i] = arrayTable[i].replace('JD\\' + time + '\\', '')
        arrayTable[i] = arrayTable[i].replace('.XDCE' + time + '.xlsx', '')
        try:
            workbook = xlrd.open_workbook('JD\\' + time + 
                '\\' + arrayTable[i] +'.XDCE' + time + '.xlsx')
            sheet1 = workbook.sheet_by_name('Sheet1')
            nrows = sheet1.nrows
            j = 1
            tradeData = []
            while(j < nrows - 1):
                tradeData.append({'date': python_date(sheet1.cell(j, 0).value),
                    'open': float(sheet1.cell(j, 1).value),
                    'high': float(sheet1.cell(j, 2).value),
                    'low': float(sheet1.cell(j, 3).value),
                    'close': float(sheet1.cell(j, 4).value)})
                j = j + 1
            strReturn =  strReturn + "'" + arrayTable[i] + "'" + ':'+ str(tradeData) + ','
            i = i + 1
        except:
            i = i + 1
            continue
    return '{' + strReturn[0: len(strReturn) - 1] + '}'

@app.route('/getEggDataByContract/<contracts>/<time>')
def getEggDataByContract(contract = 'JD9999', time='60m'):
    tradeData = []
    try:
        workbook = xlrd.open_workbook('JD\\' + time + 
            '\\' + contract +'.XDCE' + time + '.xlsx')
        sheet1 = workbook.sheet_by_name('Sheet1')
        nrows = sheet1.nrows
        j = 1
        while(j < nrows - 1):
            tradeData.append({'date': python_date(sheet1.cell(j, 0).value),
                'open': float(sheet1.cell(j, 1).value),
                'high': float(sheet1.cell(j, 2).value),
                'low': float(sheet1.cell(j, 3).value),
                'close': float(sheet1.cell(j, 4).value)})
            j = j + 1
    except:
        tradeData = []
    return  str(tradeData)

if __name__ == '__main__':
    app.run()