# 🕹️ Pac-Man Retro Arcade em Python / Web

Um jogo clássico de Pac-Man completo, simples de executar em host local via Python e totalmente funcional diretamente no navegador!

---

## 🚀 Como Executar

Abra o terminal na pasta do jogo e execute:

```bash
python server.py
```

O servidor local iniciará e abrirá automaticamente o jogo no seu navegador padrão em:
👉 **`http://localhost:8080`**

Para parar o servidor, pressione `Ctrl + C` no terminal.

---

## 🎮 Controles

| Ação | Teclas |
| :--- | :--- |
| **Mover** | Setas direcionais (`⬆`, `⬇`, `⬅`, `➡`) ou `W`, `A`, `S`, `D` |
| **Pausar / Continuar** | Barra de `Espaço` ou botão `Pausar` |
| **Ver / Ocultar FOV** | Tecla `F` ou botão `👁️ FOV` no topo |
| **Som (Mudo / Ativo)** | Ícone de som `🔊` / `🔇` |
| **Dispositivos Móveis** | D-Pad virtual na tela ou deslizar o dedo (swipe) |

---

## 👁️ Campo de Visão (FOV) & Comportamento dos Fantasmas

- **Passeio Aleatório (*Wandering*)**: Enquanto o Pac-Man estiver fora do campo de visão, os fantasmas andam aleatoriamente e exploram os corredores do mapa.
- **Detecção por FOV (*Field of View*)**:
  - Cada fantasma possui um cone de visão frontal de 135° e alcance de ~105px, além de detecção circular de proximidade (360° em curta distância).
  - Paredes sólidas bloqueiam a linha de visão do fantasma.
  - Assim que o Pac-Man entra no FOV, o fantasma entra em **alerta** (cone fica vermelho com `!`), calcula o menor caminho nos cruzamentos e **começa a persegui-lo ativamente**.
  - Se você despistar o fantasma virando esquinas e saindo do seu FOV, ele encerra a perseguição e volta a andar aleatoriamente.
- **Opção no Código para Ver o FOV**:
  No arquivo [game.js](file:///c:/Users/arthuraraujo/Documents/Brincadeiras/pacman/game.js), logo na primeira linha:
  ```javascript
  const SHOW_GHOST_FOV = true; // [true = VISÍVEL | false = OCULTO]
  ```
  Altere para `false` para esconder ou `true` para exibir. Você também pode alternar em tempo real pressionando a tecla `F` ou clicando no botão `👁️ FOV`!

---

## ✨ Funcionalidades

- **Labirinto Clássico**: 28x31 colunas com túneis de teletransporte lateral e casa central.
- **Inteligência com FOV**: Passeio aleatório autônomo com perseguição reativa quando o jogador é avistado.
- **Power Pellets**: Fantasmas ficam vulneráveis (azuis), comem-se por pontos e piscam antes de voltar ao normal.
- **Sintetizador Retrô Web Audio API**: Áudio 100% sintetizado em tempo real no navegador (sem downloads ou arquivos externos).
- **Placar e Recorde**: Salvos localmente no navegador.

