import requests
import json

# URL da sua API em Node.js
url = 'http://localhost:3000/api/enviar'

# Dados que você quer enviar (número com DDI + DDD e a mensagem)
payload = {
    "numero": "5544999029926 ", # Substitua por um número válido para testar
    "mensagem": "Olá! Este é um lembrete automático gerado pelo sistema."
}

# Cabeçalhos indicando que estamos enviando um JSON
headers = {
    'Content-Type': 'application/json'
}

try:
    # Fazendo a requisição POST para o Express
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    
    # Exibe a resposta da API (Sucesso ou Erro)
    print(f"Status Code: {response.status_code}")
    print(f"Resposta: {response.json()}")

except requests.exceptions.RequestException as e:
    print(f"Erro ao conectar com a API do WhatsApp: {e}")