from pathlib import Path
import sys


def _import_dependencias():
    try:
        import pandas as pd
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
    except ModuleNotFoundError as exc:
        pacote = exc.name
        print(
            f"❌ Dependência ausente: '{pacote}'.\n"
            "Instale com: pip install -r requirements-analise.txt",
            file=sys.stderr,
        )
        sys.exit(1)
    return pd, plt, sns


def _validar_colunas(df, obrigatorias):
    faltantes = [col for col in obrigatorias if col not in df.columns]
    if faltantes:
        raise ValueError(
            "CSV sem as colunas obrigatórias: " + ", ".join(faltantes)
        )


def main():
    pd, plt, sns = _import_dependencias()

    base_dir = Path(__file__).resolve().parent
    csv_path = base_dir / "dados-analise-lugane.csv"
    output_dir = base_dir / "graficos-analise"

    if not csv_path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {csv_path}")

    plt.style.use("seaborn-v0_8-darkgrid")
    sns.set_palette("husl")

    df = pd.read_csv(csv_path)

    _validar_colunas(
        df,
        ["Tempo_Espera_min", "Data", "Hora_Msg", "Sistema", "Problema", "Atendente"],
    )

    df["Tempo_Espera_min"] = pd.to_numeric(df["Tempo_Espera_min"], errors="coerce")
    df["Data"] = pd.to_datetime(df["Data"], format="%d/%m", errors="coerce")
    df["Hora_msg_hora"] = (
        df["Hora_Msg"].astype(str).str.split(":").str[0].astype(float).astype("Int64")
    )
    df = df.dropna(subset=["Tempo_Espera_min", "Hora_msg_hora"])

    output_dir.mkdir(parents=True, exist_ok=True)

    print("📊 Gerando gráficos de análise da Lugane...")
    print(f"Total de registros válidos: {len(df)}")
    print(f"Tempo médio de espera: {df['Tempo_Espera_min'].mean():.1f} minutos")

    # 1) Pizza
    plt.figure(figsize=(10, 6))
    sistemas_count = df["Sistema"].value_counts()
    colors = sns.color_palette("Set2", len(sistemas_count))
    plt.pie(
        sistemas_count.values,
        labels=sistemas_count.index,
        autopct="%1.1f%%",
        colors=colors,
        startangle=90,
    )
    plt.title(
        "Distribuição de Chamados por Sistema/Equipamento\n"
        "Lugane - Análise de Suporte (10-12/04/2026)",
        fontsize=14,
        fontweight="bold",
    )
    plt.tight_layout()
    plt.savefig(output_dir / "01-chamados-por-sistema.png", dpi=300, bbox_inches="tight")
    plt.close()

    # 2) Barras (tempo)
    plt.figure(figsize=(12, 6))
    tempo_por_sistema = (
        df.groupby("Sistema")["Tempo_Espera_min"].mean().sort_values(ascending=False)
    )
    bars = plt.bar(
        tempo_por_sistema.index,
        tempo_por_sistema.values,
        color=sns.color_palette("viridis", len(tempo_por_sistema)),
    )
    plt.title(
        "Tempo Médio de Resposta por Sistema/Equipamento\n"
        "Lugane - Análise de Suporte (10-12/04/2026)",
        fontsize=14,
        fontweight="bold",
    )
    plt.xlabel("Sistema/Equipamento", fontsize=12)
    plt.ylabel("Tempo Médio (minutos)", fontsize=12)
    plt.xticks(rotation=45, ha="right")
    for bar in bars:
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            height,
            f"{height:.0f}m",
            ha="center",
            va="bottom",
            fontweight="bold",
        )
    media_geral = df["Tempo_Espera_min"].mean()
    plt.axhline(
        y=media_geral,
        color="red",
        linestyle="--",
        linewidth=2,
        label=f"Média Geral: {media_geral:.0f}m",
    )
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "02-tempo-medio-por-sistema.png", dpi=300, bbox_inches="tight")
    plt.close()

    # 3) Linha por hora
    plt.figure(figsize=(12, 6))
    volume_hora = df.groupby("Hora_msg_hora").size().sort_index()
    plt.plot(
        volume_hora.index.astype(int),
        volume_hora.values,
        marker="o",
        linewidth=2,
        markersize=8,
        color="#2E86AB",
    )
    plt.fill_between(volume_hora.index.astype(int), volume_hora.values, alpha=0.3, color="#2E86AB")
    plt.title(
        "Volume de Chamados por Hora do Dia\nLugane - Análise de Suporte (10-12/04/2026)",
        fontsize=14,
        fontweight="bold",
    )
    plt.xlabel("Hora do Dia", fontsize=12)
    plt.ylabel("Quantidade de Chamados", fontsize=12)
    plt.xticks(range(8, 17))
    plt.grid(True, alpha=0.3)
    for i, v in enumerate(volume_hora.values):
        plt.text(int(volume_hora.index[i]), v + 0.1, str(v), ha="center", fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_dir / "03-volume-por-hora.png", dpi=300, bbox_inches="tight")
    plt.close()

    # 4) Top problemas
    plt.figure(figsize=(12, 7))
    problemas_count = df["Problema"].value_counts().head(8)
    bars = plt.barh(
        problemas_count.index,
        problemas_count.values,
        color=sns.color_palette("coolwarm", len(problemas_count)),
    )
    plt.title(
        "Top 8 Problemas Mais Reportados\nLugane - Análise de Suporte (10-12/04/2026)",
        fontsize=14,
        fontweight="bold",
    )
    plt.xlabel("Quantidade de Relatos", fontsize=12)
    for bar in bars:
        width = bar.get_width()
        plt.text(width, bar.get_y() + bar.get_height() / 2, f" {int(width)}", ha="left", va="center", fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_dir / "04-problemas-top8.png", dpi=300, bbox_inches="tight")
    plt.close()

    # 5) Chamados por atendente
    plt.figure(figsize=(10, 6))
    atendentes_count = df["Atendente"].value_counts()
    colors = sns.color_palette("Set1", len(atendentes_count))
    plt.bar(atendentes_count.index, atendentes_count.values, color=colors)
    plt.title(
        "Distribuição de Chamados por Atendente\nLugane - Análise de Suporte (10-12/04/2026)",
        fontsize=14,
        fontweight="bold",
    )
    plt.xlabel("Atendente", fontsize=12)
    plt.ylabel("Quantidade de Chamados", fontsize=12)
    plt.xticks(rotation=45, ha="right")
    for i, v in enumerate(atendentes_count.values):
        plt.text(i, v + 0.1, str(v), ha="center", fontweight="bold")
    plt.tight_layout()
    plt.savefig(output_dir / "05-chamados-por-atendente.png", dpi=300, bbox_inches="tight")
    plt.close()

    print(f"✅ Gráficos salvos em: {output_dir}")


if __name__ == "__main__":
    main()
