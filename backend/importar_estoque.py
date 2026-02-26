import sqlite3
import csv
import os

def importar_estoque():
    conn = sqlite3.connect('inventario.db')
    cursor = conn.cursor()

    caminho_csv = 'Estoque.csv'
    
    if not os.path.exists(caminho_csv):
        print(f"ERRO: Não encontrei o ficheiro {caminho_csv}!")
        return

    print("A importar stock para a nova estrutura...")
    inseridos = 0

    # O teu CSV usa ponto e vírgula (;) como separador
    with open(caminho_csv, 'r', encoding='utf-8') as f:
        leitor = csv.DictReader(f, delimiter=';')
        
        for linha in leitor:
            tipo = None
            modelo_base = None
            
            # Identifica o tipo
            if linha.get('Computador') and linha['Computador'].strip():
                tipo, modelo_base = 'Computador', linha['Computador'].strip()
            elif linha.get('Notebook') and linha['Notebook'].strip():
                tipo, modelo_base = 'Notebook', linha['Notebook'].strip()
            elif linha.get('Monitor/TV') and linha['Monitor/TV'].strip():
                tipo, modelo_base = 'Monitor', linha['Monitor/TV'].strip()
                
            if not tipo: continue
                
            condicao = linha.get('Condições', '').strip()
            try:
                qtd = int(linha.get('Quantidade', 1))
            except:
                qtd = 1
                
            # Formata: [Condição] Modelo
            modelo_final = f"[{condicao}] {modelo_base}" if condicao else modelo_base
                
            for _ in range(qtd):
                # estacao_id como NULL coloca-o no Stock automaticamente
                cursor.execute('''
                    INSERT INTO equipamentos (estacao_id, tipo, modelo, patrimonio)
                    VALUES (NULL, ?, ?, 'PENDENTE')
                ''', (tipo, modelo_final))
                inseridos += 1
                
    conn.commit()
    conn.close()
    print(f"SUCESSO! {inseridos} itens adicionados ao Stock.")

if __name__ == '__main__':
    importar_estoque()