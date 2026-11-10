# Veneza Estética Car

Site estático (GitHub Pages): https://hgsdevv-hash.github.io/veneza-estetica-car/
Local: preview "veneza" (porta 5690).

## Abertura
Em `main.js`, desenhada em canvas: um carro laranja passa em alta pelo asfalto, derrapa, deixa a marca dos pneus e a fumaça, e a logo aparece sobre as marcas. Roda a cada carregamento (cerca de 2 segundos), com botão Pular.

## Preços e catálogo
Os dados vêm do HTML que o cliente mandou em 10/11/2026. Ficam em `src/catalogo.py`, que gera o catálogo em abas (polimento, vitrificação, higienização, faróis, adicionais e pacotes com 10%) e as opções da agenda. Para mudar um preço, edite o arquivo e rode:

```bash
python src/catalogo.py
```

O botão Agendar de cada item já seleciona o serviço na agenda, que abre o WhatsApp (19) 99015-0008 com o pedido preenchido.

## Pendências
- Fotos reais de mais carros (com placa borrada), se o cliente mandar
- Confirmar se o atendimento é só em Sumaré ou também na região

Site por HGS Dev: https://www.hgsdev.com.br
