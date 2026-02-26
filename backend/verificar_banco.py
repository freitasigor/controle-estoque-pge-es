import sqlite3
import os

def verificar():
    db_file = 'inventario.db'
    
    if not os.path.exists(db_file):
        print(f"ERRO: O arquivo '{db_file}' não existe nesta pasta!")
        print(f"Pasta atual: {os.getcwd()}")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    try:
        # Conta quantos itens tem
        cursor.execute("SELECT count(*) FROM itens")
        total = cursor.fetchone()[0]
        
        print(f"--- RELATÓRIO DO BANCO ---")
        print(f"Arquivo do banco: {os.path.abspath(db_file)}")
        print(f"Total de itens encontrados: {total}")
        
        if total > 0:
            print("\nExemplo dos 3 primeiros itens:")
            cursor.execute("SELECT andar, setor, sala, pc_modelo FROM itens LIMIT 3")
            for linha in cursor.fetchall():
                print(f" - {linha}")
        else:
            print("\nO BANCO ESTÁ VAZIO! O script de importação rodou, mas não salvou nada.")
            
    except sqlite3.OperationalError as e:
        print(f"Erro ao ler tabela: {e}")
        print("Provavelmente a tabela 'itens' nem foi criada ainda.")

    conn.close()

if __name__ == "__main__":
    verificar()