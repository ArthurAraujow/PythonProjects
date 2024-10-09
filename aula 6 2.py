menor = float('inf')
maior = float('-inf')
altura = 0
ctm = 0
cth = 0
ct = 0
soma = 0
while True:
    altura = float(input("Digite Zero para parar[0]\nDigite sua altura: "))
    soma += altura
    if altura == 0:
        break
    if altura < menor:
        menor = altura
    if altura > maior:
        maior = altura
    genero = input(input("Digite o genero[M/F]: ")).upper()
    if genero == 'M':
        cth += 1
    if genero == 'F':
        ctm += 1
    ct += 1
media = soma / ct
print(f"O maior do grupo e: {maior}\nO menor do grupo e: {menor}\nQuantas mulheres são: {ctm}\nQuantos Homens são: {cth}\nQuantas pessoas: {ct}\nA media do grupo e: {media:.2f}")
