"""
Pac-Man - Servidor local
Execute este arquivo para iniciar o jogo no navegador.
"""
import http.server
import socketserver
import os
import webbrowser
import sys

PORT = 6767
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass  # Suprime logs no terminal


if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if __name__ == '__main__':
    port = PORT
    httpd = None
    while port < PORT + 10:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            break
        except OSError as e:
            if e.errno in (98, 48, 10048):
                port += 1
            else:
                raise

    if httpd is None:
        print(f"[!] Nao foi possivel encontrar uma porta livre entre {PORT} e {port-1}.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("\n==========================================", flush=True)
    print(f"       PAC-MAN RETRO ARCADE", flush=True)
    print(f"       Acesse: {url}", flush=True)
    print("       Pressione Ctrl+C para encerrar", flush=True)
    print("==========================================\n", flush=True)

    try:
        webbrowser.open(url)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Servidor encerrado.")
        httpd.server_close()
        sys.exit(0)


