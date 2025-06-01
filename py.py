import undetected_chromedriver as uc
import time
import random
import tkinter as tk # Biblioteca para criar a interface gráfica (janela e botão)
from tkinter import messagebox # Para mostrar mensagens na GUI (opcional)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

# --- Funções para Gerar Dados Aleatórios (iguais às anteriores) ---
def calcular_digito_cpf(cpf_parcial):
    soma = 0
    multiplicador = len(cpf_parcial) + 1
    for digito_str in cpf_parcial:
        soma += int(digito_str) * multiplicador
        multiplicador -= 1
    resto = soma % 11
    return '0' if resto < 2 else str(11 - resto)

def gerar_cpf_formatado():
    nove_digitos = [str(random.randint(0, 9)) for _ in range(9)]
    digito1 = calcular_digito_cpf(nove_digitos)
    dez_digitos = nove_digitos + [digito1]
    digito2 = calcular_digito_cpf(dez_digitos)
    cpf_completo = "".join(dez_digitos + [digito2])
    return f"{cpf_completo[:3]}.{cpf_completo[3:6]}.{cpf_completo[6:9]}-{cpf_completo[9:]}"

def gerar_celular_formatado():
    ddd = str(random.randint(11, 99))
    numero_parte1 = str(random.randint(90000, 99999))
    numero_parte2 = str(random.randint(0, 9999)).zfill(4)
    return f"({ddd}) {numero_parte1}-{numero_parte2}"

def gerar_cep_formatado():
    return "".join([str(random.randint(0, 9)) for _ in range(8)])

def gerar_nome_local_aleatorio(tipo="bairro"):
    prefixos = ["Vila", "Jardim", "Parque", "Recanto", "Bosque", "Alto"]
    nomes_base = ["Flores", "Esperança", "Vitória", "Alegria", "Harmonia", "Pinheiros", "Laranjeiras"]
    sufixos = ["Belo", "Azul", "Verde", "Central", "Norte", "Sul"]
    if tipo == "bairro":
        return f"{random.choice(prefixos)} {random.choice(nomes_base)}"
    elif tipo == "cidade":
        return f"{random.choice(nomes_base)} {random.choice(sufixos)}"
    return "Nome Local Aleatório"

def gerar_nome_completo_aleatorio():
    primeiros_nomes = ["Carlos", "Mariana", "João", "Ana", "Pedro", "Sofia", "Lucas", "Laura", "Mateus", "Julia", "Gabriel", "Beatriz", "Daniel", "Manuela", "Bruno", "Isabela", "Rafael", "Larissa", "Thiago", "Camila"]
    sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Melo", "Barbosa", "Nunes", "Araújo", "Fernandes"]
    primeiro_nome = random.choice(primeiros_nomes)
    sobrenome1 = random.choice(sobrenomes)
    sobrenome2 = random.choice(sobrenomes)
    while sobrenome2 == sobrenome1:
        sobrenome2 = random.choice(sobrenomes)
    return f"{primeiro_nome} {sobrenome1} {sobrenome2}"

# --- Funções Auxiliares para Selenium (iguais às anteriores) ---
def preencher_campo_texto(driver_ref, id_campo, valor, nome_campo_desc): # driver_ref em vez de driver
    try:
        print(f"🔎 Procurando campo '{nome_campo_desc}' (ID: {id_campo})...")
        campo = WebDriverWait(driver_ref, 10).until(
            EC.visibility_of_element_located((By.ID, id_campo))
        )
        campo.clear()
        campo.send_keys(valor)
        print(f"✅ Campo '{nome_campo_desc}' preenchido com '{valor}'.")
    except Exception as e:
        print(f"❌ Erro ao preencher '{nome_campo_desc}' (ID: {id_campo}): {e}")

def selecionar_opcao_dropdown(driver_ref, id_campo, valor_opcao, nome_campo_desc): # driver_ref em vez de driver
    try:
        print(f"🔎 Procurando dropdown '{nome_campo_desc}' (ID: {id_campo})...")
        dropdown_el = WebDriverWait(driver_ref, 10).until(
            EC.element_to_be_clickable((By.ID, id_campo))
        )
        select_obj = Select(dropdown_el)
        select_obj.select_by_value(valor_opcao)
        print(f"✅ Opção '{valor_opcao}' selecionada em '{nome_campo_desc}'.")
    except Exception as e:
        print(f"❌ Erro ao selecionar '{valor_opcao}' em '{nome_campo_desc}' (ID: {id_campo}): {e}")

# Variável global para o driver do Selenium, para ser acessível pela função do Tkinter
selenium_driver = None

def acao_preencher_formulario():
    global selenium_driver # Acessa a variável global
    if not selenium_driver:
        messagebox.showerror("Erro", "O navegador não foi iniciado ou não está acessível.")
        print("❌ Tentativa de preencher formulário sem navegador iniciado.")
        return

    print("\n✨ BOTÃO CLICADO: Iniciando preenchimento do formulário... ✨")

    # --- Dados para o formulário ---
    nome_completo_valor = gerar_nome_completo_aleatorio()
    senha_valor = "Sexo123123123"
    cpf_valor = gerar_cpf_formatado()
    celular_valor = gerar_celular_formatado()
    data_nasc_valor = "12/12/2001"
    cep_valor = gerar_cep_formatado()
    endereco_valor = "casa 1"
    numero_res_valor = "1"
    complemento_valor = "complemento 1"
    bairro_valor = gerar_nome_local_aleatorio("bairro")
    cidade_valor = gerar_nome_local_aleatorio("cidade")
    estado_valor_select = "DF"
    pais_valor_select = "Brasil"
    genero_valor_select = "Masculino"

    # --- Preenchendo os campos (usando selenium_driver) ---
    print("\n--- Iniciando preenchimento dos campos ---")
    preencher_campo_texto(selenium_driver, "displayName", nome_completo_valor, "Nome Completo")
    preencher_campo_texto(selenium_driver, "newPassword", senha_valor, "Senha")
    preencher_campo_texto(selenium_driver, "reenterPassword", senha_valor, "Confirmar Senha")
    preencher_campo_texto(selenium_driver, "extension_CPF", cpf_valor, "CPF")
    preencher_campo_texto(selenium_driver, "extension_Celular", celular_valor, "Celular")
    preencher_campo_texto(selenium_driver, "extension_DataNascimento", data_nasc_valor, "Data de Nascimento")
    preencher_campo_texto(selenium_driver, "extension_CEP", cep_valor, "CEP")
    preencher_campo_texto(selenium_driver, "streetAddress", endereco_valor, "Endereço")
    preencher_campo_texto(selenium_driver, "extension_Numero", numero_res_valor, "Número da Residência")
    preencher_campo_texto(selenium_driver, "extension_Complemento", complemento_valor, "Complemento")
    preencher_campo_texto(selenium_driver, "extension_Bairro", bairro_valor, "Bairro")
    preencher_campo_texto(selenium_driver, "city", cidade_valor, "Cidade")
    selecionar_opcao_dropdown(selenium_driver, "state", estado_valor_select, "Estado")
    selecionar_opcao_dropdown(selenium_driver, "country", pais_valor_select, "País/Região")
    selecionar_opcao_dropdown(selenium_driver, "extension_Genero", genero_valor_select, "Gênero")
    print("--- Fim do preenchimento dos campos ---")
    messagebox.showinfo("Sucesso", "Tentativa de preenchimento do formulário concluída! Verifique o console para detalhes.")


def iniciar_tudo():
    global selenium_driver # Define que vamos usar a variável global
    try:
        options = uc.ChromeOptions()
        # options.add_argument('--headless')
        # options.add_argument('--start-maximized')

        print("🚀 Iniciando o navegador com undetected-chromedriver...")
        selenium_driver = uc.Chrome(options=options) # Atribui à variável global
        print("✅ Navegador iniciado com sucesso!")

        url = "https://flapremios.com.br"
        print(f"🔗 Navegando para: {url}")
        selenium_driver.get(url)
        print(f"🕒 Página {url} carregada.")

        # --- Configuração da Janela Tkinter ---
        root = tk.Tk()
        root.title("Controle de Preenchimento")
        root.geometry("350x150") # Tamanho da janelinha (largura x altura)

        label_instrucao = tk.Label(root, text="Navegador aberto em flapremios.com.br\nClique no botão para preencher os dados:")
        label_instrucao.pack(pady=10) # Adiciona um espaço vertical

        botao_preencher = tk.Button(root, text="Preencher Formulário Agora", command=acao_preencher_formulario, bg="lightblue", font=("Arial", 10, "bold"))
        botao_preencher.pack(pady=10, padx=20, ipadx=10, ipady=5) # Adiciona espaços e preenchimento interno

        # Função para fechar o navegador ao fechar a janela Tkinter
        def ao_fechar_janela_tkinter():
            print("🚪 Janela Tkinter fechada pelo usuário.")
            if selenium_driver:
                print("🚪 Fechando o navegador também...")
                selenium_driver.quit()
            root.destroy() # Fecha a janela Tkinter

        root.protocol("WM_DELETE_WINDOW", ao_fechar_janela_tkinter) # Define o que acontece ao clicar no 'X' da janela
        root.mainloop() # Mantém a janela Tkinter aberta e responsiva

    except Exception as e:
        print(f"❌ Ocorreu um erro geral no script: {e}")
        if selenium_driver: # Se o driver foi iniciado antes do erro, fecha ele
            selenium_driver.quit()
    finally:
        # Este bloco finally pode não ser estritamente necessário se ao_fechar_janela_tkinter cuidar de tudo,
        # mas é uma segurança adicional caso o script saia de forma inesperada antes do mainloop.
        # No entanto, com o mainloop, o fluxo principal pausa ali.
        # A melhor prática é garantir que o quit seja chamado quando a GUI é fechada.
        print("Script finalizado.")


if __name__ == '__main__':
    iniciar_tudo()