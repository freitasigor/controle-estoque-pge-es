import sqlite3
import openpyxl
import os

def clean_val(val):
    if val is None: return None
    v_str = str(val).strip()
    termos_negativos = ['não', 'nao', 'não possui', 'nao possui', '-', '0', 'nan', 'sem', 'vago', 'none']
    if v_str.lower() in termos_negativos: return None
    return v_str

def recriar_banco():
    conn = sqlite3.connect('inventario.db')
    cursor = conn.cursor()

    # CRIA A NOVA ESTRUTURA PROFISSIONAL
    cursor.executescript('''
        DROP TABLE IF EXISTS equipamentos;
        DROP TABLE IF EXISTS estacoes;
        DROP TABLE IF EXISTS historico;

        CREATE TABLE estacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            andar TEXT, setor TEXT, sala TEXT, observacao TEXT
        );

        CREATE TABLE equipamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estacao_id INTEGER,
            tipo TEXT, modelo TEXT, patrimonio TEXT,
            FOREIGN KEY (estacao_id) REFERENCES estacoes (id)
        );

        CREATE TABLE historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT, acao TEXT
        );
    ''')

    file_xlsx = 'INVENTÁRIO NOVO.xlsx'
    if not os.path.exists(file_xlsx):
        print(f"ERRO: Arquivo {file_xlsx} não encontrado!")
        return

    print("Importando dados do Excel...")
    wb = openpyxl.load_workbook(file_xlsx)
    planilha = wb.active
    
    for linha in planilha.iter_rows(min_row=2, values_only=True):
        dados = ["" if c is None else str(c).strip() for c in linha]
        if not dados or len(''.join(dados).strip()) == 0: continue
        while len(dados) < 17: dados.append("")
        
        # Insere a Estação
        cursor.execute('INSERT INTO estacoes (andar, setor, sala, observacao) VALUES (?, ?, ?, ?)', 
                      (dados[0], dados[1], dados[2], dados[16]))
        est_id = cursor.lastrowid
        
        # Mapeia equipamentos do Excel para a nova tabela
        equips = [
            ('Computador', clean_val(dados[3]), clean_val(dados[4])),
            ('Monitor', clean_val(dados[5]), clean_val(dados[6])),
            ('Monitor', clean_val(dados[7]), clean_val(dados[8])),
            ('Notebook', clean_val(dados[11]), clean_val(dados[12]))
        ]
        for t, m, p in equips:
            if m: cursor.execute('INSERT INTO equipamentos (estacao_id, tipo, modelo, patrimonio) VALUES (?,?,?,?)', (est_id, t, m, p if p else "PENDENTE"))

    conn.commit()
    conn.close()
    print("BANCO SINCRONIZADO COM SUCESSO!")

if __name__ == '__main__':
    recriar_banco()