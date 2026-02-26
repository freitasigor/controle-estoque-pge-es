import sqlite3
from datetime import datetime

def criar_banco_ficticio():
    # Conecta (ou cria) o banco de dados
    conn = sqlite3.connect("inventario.db")
    cursor = conn.cursor()

    print("Limpando banco de dados antigo...")
    cursor.executescript('''
        DROP TABLE IF EXISTS equipamentos;
        DROP TABLE IF EXISTS estacoes;
        DROP TABLE IF EXISTS historico;
    ''')

    print("Criando tabelas...")
    cursor.executescript('''
        CREATE TABLE estacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            andar TEXT,
            setor TEXT,
            sala TEXT
        );

        CREATE TABLE equipamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estacao_id INTEGER,
            tipo TEXT,
            modelo TEXT,
            patrimonio TEXT,
            FOREIGN KEY(estacao_id) REFERENCES estacoes(id)
        );

        CREATE TABLE historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT,
            acao TEXT
        );
    ''')

    print("Inserindo estações fictícias...")
    estacoes = [
        ("Térreo", "Recepção", "01"),
        ("1º Andar", "Recursos Humanos", "101"),
        ("1º Andar", "TI e Suporte", "102"),
        ("2º Andar", "Diretoria", "201")
    ]
    cursor.executemany("INSERT INTO estacoes (andar, setor, sala) VALUES (?, ?, ?)", estacoes)

    print("Inserindo equipamentos nas estações e no estoque...")
    equipamentos = [
        # Equipamentos nas Estações (estacao_id de 1 a 4)
        (1, "Computador", "[Usado] Dell Optiplex 3080", "PAT-10001"),
        (1, "Monitor", "Dell 24 Pol", "PAT-10002"),
        (2, "Computador", "[Novo] HP ProDesk 400", "PAT-10003"),
        (2, "Monitor", "HP 22 Pol", "PAT-10004"),
        (2, "Monitor", "HP 22 Pol", "PAT-10005"),
        (3, "Notebook", "[Novo] Lenovo ThinkPad T14", "PAT-10006"),
        (4, "Computador", "Dell Optiplex 7090", "PAT-10007"),
        
        # Equipamentos no Estoque (estacao_id = NULL)
        (None, "Computador", "[Usado (Disponível pra uso)] Dell Vostro", "PAT-90001"),
        (None, "Monitor", "[Novo] Samsung 24 Pol", "PAT-90002"),
        (None, "Notebook", "[Com defeito] Acer Aspire", "PENDENTE"),
        (None, "Impressora", "[Novo] Brother Laser", "PAT-90003"),
    ]
    cursor.executemany("INSERT INTO equipamentos (estacao_id, tipo, modelo, patrimonio) VALUES (?, ?, ?, ?)", equipamentos)

    print("Gerando histórico...")
    data_atual = datetime.now().strftime("%d/%m/%Y %H:%M")
    logs = [
        (data_atual, "Sistema populado com dados fictícios para portfólio."),
        (data_atual, "Equipamento PAT-10001 instalado na estação 1"),
        (data_atual, "Equipamento PAT-10006 recebido no estoque da TI")
    ]
    cursor.executemany("INSERT INTO historico (data, acao) VALUES (?, ?)", logs)

    conn.commit()
    conn.close()
    print("Sucesso! O arquivo inventario.db agora possui apenas dados fictícios.")

if __name__ == "__main__":
    criar_banco_ficticio()