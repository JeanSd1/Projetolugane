import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os

# Configurar estilo
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Ler dados
df = pd.read_csv('dados-analise-lugane.csv')

# Converter colunas
df['Tempo_Espera_min'] = pd.to_numeric(df['Tempo_Espera_min'])
df['Data'] = pd.to_datetime(df['Data'], format='%d/%m')
df['Hora_msg_hora'] = df['Hora_Msg'].str.split(':').str[0].astype(int)

# Criar pasta para salvar figuras
os.makedirs('graficos-analise', exist_ok=True)

print("📊 Gerando gráficos de análise da Lugane...")
print(f"Total de registros: {len(df)}")
print(f"Tempo médio de espera: {df['Tempo_Espera_min'].mean():.1f} minutos")

# ============ GRÁFICO 1: PIE (Chamados por Sistema) ============
plt.figure(figsize=(10, 6))
sistemas_count = df['Sistema'].value_counts()
colors = sns.color_palette("Set2", len(sistemas_count))
plt.pie(sistemas_count.values, labels=sistemas_count.index, autopct='%1.1f%%', colors=colors, startangle=90)
plt.title('Distribuição de Chamados por Sistema/Equipamento\nLugane - Análise de Suporte (10-12/04/2026)', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('graficos-analise/01-chamados-por-sistema.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico 1 salvo: 01-chamados-por-sistema.png")
plt.close()

# ============ GRÁFICO 2: BAR (Tempo Médio por Sistema) ============
plt.figure(figsize=(12, 6))
tempo_por_sistema = df.groupby('Sistema')['Tempo_Espera_min'].mean().sort_values(ascending=False)
bars = plt.bar(tempo_por_sistema.index, tempo_por_sistema.values, color=sns.color_palette("viridis", len(tempo_por_sistema)))
plt.title('Tempo Médio de Resposta por Sistema/Equipamento\nLugane - Análise de Suporte (10-12/04/2026)', fontsize=14, fontweight='bold')
plt.xlabel('Sistema/Equipamento', fontsize=12)
plt.ylabel('Tempo Médio (minutos)', fontsize=12)
plt.xticks(rotation=45, ha='right')
for i, bar in enumerate(bars):
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.0f}m', ha='center', va='bottom', fontweight='bold')
plt.axhline(y=df['Tempo_Espera_min'].mean(), color='red', linestyle='--', linewidth=2, label=f'Média Geral: {df["Tempo_Espera_min"].mean():.0f}m')
plt.legend()
plt.tight_layout()
plt.savefig('graficos-analise/02-tempo-medio-por-sistema.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico 2 salvo: 02-tempo-medio-por-sistema.png")
plt.close()

# ============ GRÁFICO 3: LINE (Volume de Chamados por Hora) ============
plt.figure(figsize=(12, 6))
volume_hora = df.groupby('Hora_msg_hora').size()
plt.plot(volume_hora.index, volume_hora.values, marker='o', linewidth=2, markersize=8, color='#2E86AB')
plt.fill_between(volume_hora.index, volume_hora.values, alpha=0.3, color='#2E86AB')
plt.title('Volume de Chamados por Hora do Dia\nLugane - Análise de Suporte (10-12/04/2026)', fontsize=14, fontweight='bold')
plt.xlabel('Hora do Dia', fontsize=12)
plt.ylabel('Quantidade de Chamados', fontsize=12)
plt.xticks(range(8, 17))
plt.grid(True, alpha=0.3)
for i, v in enumerate(volume_hora.values):
    plt.text(volume_hora.index[i], v + 0.1, str(v), ha='center', fontweight='bold')
plt.tight_layout()
plt.savefig('graficos-analise/03-volume-por-hora.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico 3 salvo: 03-volume-por-hora.png")
plt.close()

# ============ GRÁFICO 4: BONUS - Problemas Mais Comuns ============
plt.figure(figsize=(12, 7))
problemas_count = df['Problema'].value_counts().head(8)
bars = plt.barh(problemas_count.index, problemas_count.values, color=sns.color_palette("coolwarm", len(problemas_count)))
plt.title('Top 8 Problemas Mais Reportados\nLugane - Análise de Suporte (10-12/04/2026)', fontsize=14, fontweight='bold')
plt.xlabel('Quantidade de Relatos', fontsize=12)
for i, bar in enumerate(bars):
    width = bar.get_width()
    plt.text(width, bar.get_y() + bar.get_height()/2.,
            f' {int(width)}', ha='left', va='center', fontweight='bold')
plt.tight_layout()
plt.savefig('graficos-analise/04-problemas-top8.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico 4 salvo: 04-problemas-top8.png")
plt.close()

# ============ GRÁFICO 5: BONUS - Distribuição de Cargas por Atendente ============
plt.figure(figsize=(10, 6))
atendentes_count = df['Atendente'].value_counts()
colors = sns.color_palette("Set1", len(atendentes_count))
plt.bar(atendentes_count.index, atendentes_count.values, color=colors)
plt.title('Distribuição de Chamados por Atendente\nLugane - Análise de Suporte (10-12/04/2026)', fontsize=14, fontweight='bold')
plt.xlabel('Atendente', fontsize=12)
plt.ylabel('Quantidade de Chamados', fontsize=12)
plt.xticks(rotation=45, ha='right')
for i, v in enumerate(atendentes_count.values):
    plt.text(i, v + 0.1, str(v), ha='center', fontweight='bold')
plt.tight_layout()
plt.savefig('graficos-analise/05-chamados-por-atendente.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico 5 salvo: 05-chamados-por-atendente.png")
plt.close()

print("\n" + "="*60)
print("📈 RESUMO DA ANÁLISE - LUGANE COMÉRCIO E SERVIÇOS LTDA")
print("="*60)
print(f"Período Analisado: 10 a 12 de Abril de 2026")
print(f"Total de Chamados: {len(df)}")
print(f"Tempo Médio de Resposta: {df['Tempo_Espera_min'].mean():.1f} minutos")
print(f"Tempo Mínimo: {df['Tempo_Espera_min'].min()} minutos")
print(f"Tempo Máximo: {df['Tempo_Espera_min'].max()} minutos")
print(f"\nSistemas Analisados: {', '.join(df['Sistema'].unique())}")
print(f"\nAtendentes: {', '.join(df['Atendente'].unique())}")
print(f"Chamados por Atendente: {df['Atendente'].value_counts().to_dict()}")
print("\n✅ Todos os gráficos foram salvos em: ./graficos-analise/")
print("="*60)
