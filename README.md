# 🚗 Motorista Gestor - Versão Simples

Um app leve e responsivo para motoristas de aplicativos controlarem ganhos e despesas.

**Sem dependências externas. Só HTML, CSS e JavaScript puro!**

## 🚀 Como Usar

1. Abra `index.html` no navegador
2. Pronto! Comece a registrar suas corridas e despesas

## 📱 Funcionalidades

- ✅ **Dashboard**: Veja seu ganho do dia, semana e mês
- ✅ **Registrar Corridas**: Adicione cada corrida com plataforma e valor
- ✅ **Registrar Despesas**: Controle todas as despesas
- ✅ **Cálculo Automático**: Combustível é calculado automaticamente (5.5/L, 8km/L)
- ✅ **Relatórios**: Veja ganhos por plataforma e despesas por categoria
- ✅ **Offline**: Dados salvos no seu navegador com LocalStorage

## 📁 Arquivos

```
index.html    → Interface HTML
styles.css    → Estilos (dark mode)
app.js        → Toda a lógica JavaScript
```

## 🎨 Cores

- Verde (#22c55e) - Ganhos
- Azul (#0ea5e9) - Secundário
- Vermelho (#ef4444) - Despesas
- Fundo escuro (#0a0e27) - Theme dark

## 💾 Dados

Os dados são salvos no **LocalStorage** do seu navegador:
- Não é necessário banco de dados
- Dados permanecem mesmo após fechar o navegador
- Use de qualquer dispositivo (mobile, tablet, PC)

## 📊 Cálculo de Combustível

Padrão: **R$ 5.50 / litro** e **8 km/litro**

Se você rodou 16km:
- Combustível gasto: 2 litros
- Custo: R$ 11.00

Customize alterando os valores em `app.js` (linhas 89-90).

## 🔧 Customizar

### Mudar custo de combustível
No arquivo `app.js`, encontre a linha:
```javascript
const combustivel = (distancia / 8) * 5.5;
```

Troque `8` (km/litro) e `5.5` (R$/litro) pelos seus valores.

### Mudar meta mensal
No arquivo `app.js`, procure por:
```javascript
let metaMensal = parseFloat(localStorage.getItem('metaMensal')) || 5000;
```

Troque `5000` pela sua meta.

## 📱 Responsivo

Funciona perfeito em:
- 📱 Celular (principal)
- 📱 Tablet
- 💻 PC/Notebook

## ⚡ Performance

- **Muito leve**: Menos de 50KB total
- **Rápido**: Carrega em milissegundos
- **Offline**: Funciona sem internet
- **Seguro**: Dados ficam no seu navegador

## 🐛 Problemas?

### Dados desapareceram
- Verifique se não limpou o histórico/cache do navegador
- LocalStorage pode ser limpo em navegação privada

### Como limpar dados
Abra o console (F12) e execute:
```javascript
localStorage.clear()
```

## 📈 Próximos Passos

Quer adicionar algo? Ideias:
- [ ] Exportar dados (CSV/PDF)
- [ ] Fazer backup
- [ ] Integrar com Google Sheets
- [ ] App mobile nativa

## 📄 Licença

Livre para usar e modificar!

---

**Desenvolvido para motoristas de aplicativos** 🚗💨
