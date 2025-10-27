import customtkinter as ctk
from tkinter import messagebox
import requests

base_producao = {
    "Alface": 2.5,
    "Tomate": 6.0,
    "Manjericão": 1.5,
    "Cebolinha": 0.5,
    "Pimenta": 1.75
}

sol_ideal = {
    "Alface": 8,
    "Tomate": 7,
    "Manjericão": 8,
    "Cebolinha": 6,
    "Pimenta": 8
}

pancs = {
    "Ora-pro-nóbis": 1.2,
    "Taioba": 1.8,
    "Caruru": 0.7,
    "Beldroega": 0.9
}

pancsSol = {
    "Ora-pro-nóbis": 6,
    "Taioba": 5,
    "Caruru": 6,
    "Beldroega": 5
}

agua_necessaria = {
    "Alface": 30,  # L/m²/semana
    "Tomate": 30,
    "Manjericão": 30,
    "Cebolinha": 25,
    "Pimenta": 25,
    "Ora-pro-nóbis": 15,
    "Taioba": 35,
    "Caruru": 20,
    "Beldroega": 10
}

base_producao.update(pancs)
sol_ideal.update(pancsSol)

orientacoes = {
    "Horizontal": 1.0,
    "Vertical": 1.2
}

climas = {
    "Quente": 1.1,
    "Temperado": 1.0,
    "Frio": 0.9
}

def calcular_producao():
    try:
        planta = var_planta.get()
        horas_sol = float(entry_horas.get())
    
        if horas_sol > 12:
            messagebox.showerror("Erro", "O valor máximo permitido para horas de sol é 12h.")
            return

        area = float(entry_area.get())
        clima = var_clima.get()
        orient = var_orient.get()
        city = entry_city.get().strip()
        
        base = base_producao[planta]
        ideal = sol_ideal[planta]
        sol_mult = horas_sol / ideal
        
        clima_factor = climas[clima]
        orient_factor = orientacoes[orient]
        
        producao = base * area * sol_mult * clima_factor * orient_factor
        
        resultado = (
            f"PREVISÃO DE COLHEITA PARA {planta.upper()}\n\n"
            f"• Planta: {planta}\n"
            f"• Horas de sol/dia: {horas_sol}h (ideal: {ideal}h)\n"
            f"• Área cultivada: {area} m²\n"
            f"• Clima: {clima}\n"
            f"• Orientação: {orient}\n\n"
            f"Produção total estimada: {producao:.1f} kg"
        )

        # Gestão Hídrica base
        agua_base = agua_necessaria[planta] * area  # L/semana

        # Predição Climática e ajuste hídrico
        if city:
            try:
                # Geocoding com Nominatim
                url_geo = f"https://nominatim.openstreetmap.org/search?q={city}&format=json"
                resp_geo = requests.get(url_geo, headers={'User-Agent': 'HortinhaApp'})
                data_geo = resp_geo.json()
                if data_geo:
                    lat = data_geo[0]['lat']
                    lon = data_geo[0]['lon']

                    # Previsão com Open-Meteo (7 dias)
                    url_weather = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_mean,precipitation_sum&timezone=auto"
                    resp_weather = requests.get(url_weather)
                    data_weather = resp_weather.json()

                    if 'daily' in data_weather:
                        temps = data_weather['daily']['temperature_2m_mean'][:7]
                        precips = data_weather['daily']['precipitation_sum'][:7]

                        if temps:
                            avg_temp = sum(temps) / len(temps)
                            total_precip = sum(p for p in precips if p is not None)

                            # Classificar clima previsto
                            if avg_temp > 25:
                                clima_pred = "Quente"
                            elif avg_temp < 15:
                                clima_pred = "Frio"
                            else:
                                clima_pred = "Temperado"

                            # Água líquida necessária (subtraindo chuva)
                            precip_volume = total_precip * area  # mm * m² = L
                            net_agua = max(0, agua_base - precip_volume)

                            resultado += (
                                f"\n\nGESTÃO HÍDRICA (para próxima semana):\n"
                                f"• Água base necessária: {agua_base:.1f} L\n"
                                f"• Precipitação esperada: {total_precip:.1f} mm ({precip_volume:.1f} L na área)\n"
                                f"• Água a irrigar: {net_agua:.1f} L"
                            )

                            resultado += (
                                f"\n\nPREDIÇÃO CLIMÁTICA (próxima semana):\n"
                                f"• Temperatura média esperada: {avg_temp:.1f} °C\n"
                                f"• Clima previsto: {clima_pred}"
                            )
                        else:
                            resultado += "\n\nDados de previsão indisponíveis."
                    else:
                        resultado += "\n\nErro ao obter dados meteorológicos."
                else:
                    resultado += "\n\nCidade não encontrada."
            except Exception as e:
                resultado += f"\n\nErro na integração climática: {str(e)}"
        else:
            resultado += f"\n\nGESTÃO HÍDRICA (sem previsão):\n• Água base necessária: {agua_base:.1f} L/semana"

        label_resultado.configure(text=resultado)

    except ValueError:
        messagebox.showerror("Erro", "Digite valores numéricos válidos para horas de sol e área.")

janela = ctk.CTk()
janela.title("Hortinha")
janela.geometry("500x700")
janela.resizable(False, True)

label_titulo = ctk.CTkLabel(janela, text="Hortinha", font=("Arial", 16))
label_titulo.pack(pady=10)

frame_inputs = ctk.CTkFrame(janela)
frame_inputs.pack(pady=5)

frame_planta = ctk.CTkFrame(frame_inputs)
frame_planta.pack(pady=5)
ctk.CTkLabel(frame_planta, text="Escolha sua planta:", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
var_planta = ctk.StringVar(value="Alface")
menu_planta = ctk.CTkOptionMenu(frame_planta, variable=var_planta, values=list(base_producao.keys()))
menu_planta.pack(side=ctk.LEFT)

frame_horas = ctk.CTkFrame(frame_inputs)
frame_horas.pack(pady=5)
ctk.CTkLabel(frame_horas, text="Horas de sol/dia:", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
entry_horas = ctk.CTkEntry(frame_horas, width=100)
entry_horas.pack(side=ctk.LEFT)

frame_area = ctk.CTkFrame(frame_inputs)
frame_area.pack(pady=5)
ctk.CTkLabel(frame_area, text="Área (m²):", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
entry_area = ctk.CTkEntry(frame_area, width=100)
entry_area.pack(side=ctk.LEFT)

frame_clima = ctk.CTkFrame(frame_inputs)
frame_clima.pack(pady=5)
ctk.CTkLabel(frame_clima, text="Clima da região:", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
var_clima = ctk.StringVar(value="Temperado")
menu_clima = ctk.CTkOptionMenu(frame_clima, variable=var_clima, values=list(climas.keys()))
menu_clima.pack(side=ctk.LEFT)

frame_orient = ctk.CTkFrame(frame_inputs)
frame_orient.pack(pady=5)
ctk.CTkLabel(frame_orient, text="Orientação da horta:", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
var_orient = ctk.StringVar(value="Horizontal")
menu_orient = ctk.CTkOptionMenu(frame_orient, variable=var_orient, values=list(orientacoes.keys()))
menu_orient.pack(side=ctk.LEFT)

frame_city = ctk.CTkFrame(frame_inputs)
frame_city.pack(pady=5)
ctk.CTkLabel(frame_city, text="Cidade para previsão:", font=("Arial", 12)).pack(side=ctk.LEFT, padx=5)
entry_city = ctk.CTkEntry(frame_city, width=150)
entry_city.pack(side=ctk.LEFT)

botao_calcular = ctk.CTkButton(janela, text="Calcular Produção", font=("Arial", 12), command=calcular_producao)
botao_calcular.pack(pady=20)

scroll_frame = ctk.CTkScrollableFrame(janela, width=460, height=250)
scroll_frame.pack(pady=10, padx=10)

label_resultado = ctk.CTkLabel(scroll_frame, text="", font=("Arial", 12), justify=ctk.LEFT, anchor="w", wraplength=440)
label_resultado.pack(pady=10, padx=10)

# Removi label_dados pois não estava sendo usado

janela.mainloop()