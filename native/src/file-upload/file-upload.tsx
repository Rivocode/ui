import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { getDocumentAsync } from "expo-document-picker";

import { Progress } from "../basics";
import { cn } from "../cn";
import { mono } from "../font";

/**
 * Um arquivo escolhido.
 *
 * O tipo é nosso, e não o `DocumentPickerAsset` do Expo, por duas razões. A
 * primeira é de contrato: o tipo deles carrega `file?: File` e `base64?`, que
 * são do passe web e não existem no telefone — reexportá-los prometeria ao app
 * campos que ele nunca vai receber. A segunda é de instalação: um tipo
 * reexportado obriga quem só lê a assinatura a ter o peer instalado para o
 * `tsc` fechar.
 */
export type PickedFile = {
  /** O endereço local do arquivo. É com ele que o app sobe o conteúdo. */
  uri: string;
  /** O nome de origem, como estava no aparelho. */
  name: string;
  /**
   * Em bytes. **Pode faltar**: nem todo provedor de arquivo do Android
   * informa o tamanho, e por isso `maxSize` só recusa o que conseguiu medir.
   */
  size?: number;
  mimeType?: string;
};

export type Rejection = {
  file: PickedFile;
  /** Pronto para um aviso: "maior que 5 MB", "tipo não aceito". */
  reason: string;
};

/**
 * "48,2 KB", "1,2 MB" — a vírgula do pt-BR escrita à mão.
 *
 * O web usa `Intl.NumberFormat`, e aqui não: é a mesma decisão do `Meter`
 * nativo sem `format` e do `RelativeTime` sempre numérico — carregar o `Intl`
 * no bundle do celular por causa de uma casa decimal não se paga.
 */
function decimal(value: number) {
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${decimal(bytes)} B`;
  if (bytes < 1024 * 1024) return `${decimal(bytes / 1024)} KB`;
  return `${decimal(bytes / (1024 * 1024))} MB`;
}

/** `accept` sempre em lista, venha como string única ou já em lista. */
function tokensOf(accept: string | string[] | undefined) {
  if (accept === undefined) return [];
  const raw = Array.isArray(accept) ? accept : accept.split(",");
  return raw.map((token) => token.trim().toLowerCase()).filter(Boolean);
}

/** A mesma regra do web: extensão com ponto, MIME, ou `tipo/*`. */
function matchesAccept(file: PickedFile, tokens: string[]) {
  const name = file.name.toLowerCase();
  const type = (file.mimeType ?? "").toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export type FileUploadProps = {
  /** O que o botão diz: "Escolher o XML da nota". */
  label: string;
  /** A letra miúda: formatos e limite, para a pessoa não descobrir na recusa. */
  hint?: string;
  /**
   * Os tipos aceitos. **Só MIME chega ao seletor do sistema** —
   * `application/pdf`, `text/xml`, `image/*` —, porque é o que o
   * `expo-document-picker` sabe filtrar. Extensão com ponto (`.xml`) continua
   * valendo na validação de volta, contra o nome do arquivo, mas não vai para
   * o diálogo: mandá-la para lá filtraria tudo e o seletor abriria vazio.
   */
  accept?: string | string[];
  multiple?: boolean;
  /** Em bytes. Arquivo maior não entra: vira recusa com o motivo. */
  maxSize?: number;
  disabled?: boolean;
  /** Os que passaram na validação. Subir é trabalho do app, que conhece a rede. */
  onSelect?: (files: PickedFile[]) => void;
  /** Os que não passaram, cada um com o motivo legível. */
  onReject?: (rejections: Rejection[]) => void;
  className?: string;
};

/** A seta para cima sobre a base, desenhada com `View`. */
function UploadIcon() {
  return (
    <View className="h-4 w-4 items-center justify-end">
      <View className="absolute top-0 h-2 w-2 rotate-45 border-t-2 border-l-2 border-fg-muted" />
      <View className="absolute top-0.5 h-2.5 w-0.5 rounded-pill bg-fg-muted" />
      <View className="h-0.5 w-3.5 rounded-pill bg-fg-muted" />
    </View>
  );
}

/**
 * A área de anexar — que aqui **não é uma área**.
 *
 * A peça não conhece rede, de propósito, como no web: ela valida `accept` e
 * `maxSize` na entrada, entrega os aceitos em `onSelect` e os recusados em
 * `onReject`. Subir o arquivo — fetch, progresso real, nova tentativa — é do
 * app, que sabe o endereço e a autenticação.
 *
 * ## O que substitui a área de soltar
 *
 * Um botão, e só. No celular não há arrastar: nada pode ser solto em lugar
 * nenhum, e o retângulo tracejado de 96px de altura do web é, letra por letra,
 * o idioma de "solte aqui" — desenhá-lo numa tela de toque promete um gesto
 * que o aparelho não tem. Tirado o soltar, o que sobra daquela caixa é um
 * botão com muito espaço vazio em volta: **o espaço era o alvo de soltar, e
 * não a affordance**. A affordance é o botão, e ele cabe numa altura de
 * controle.
 *
 * A conta fecha do outro lado também. Numa tela de 390px, aquela caixa comia
 * um quarto da altura útil para dizer uma frase — e o que importa nesta tela é
 * a **lista**, que é onde o arquivo aparece, sobe, falha e é removido. O botão
 * devolve esse espaço para ela.
 *
 * O `hint` continua fazendo o trabalho que faz no web, e por isso ele entra no
 * nome falado do botão: quem ouve a tela precisa saber "XML ou PDF, até 5 MB"
 * **antes** de abrir o seletor, não depois de ser recusado.
 *
 * ## Desistir não é um final
 *
 * Fechar o seletor do sistema devolve `canceled` e **nenhum callback dispara**
 * — como no web, onde fechar a janela do seletor não avisa ninguém. Uma tela
 * que precise saber disso está querendo um estado que a peça não tem.
 */
export function FileUpload({
  label,
  hint,
  accept,
  multiple,
  maxSize,
  disabled,
  onSelect,
  onReject,
  className,
}: FileUploadProps) {
  const tokens = tokensOf(accept);
  // Só o que o diálogo do sistema entende. Sobrando nada, ele abre sem
  // restrição - e a validação de volta continua valendo do mesmo jeito.
  const mimes = tokens.filter((token) => !token.startsWith("."));

  function deliver(
    assets: readonly { uri: string; name: string; size?: number; mimeType?: string }[],
  ) {
    const accepted: PickedFile[] = [];
    const rejected: Rejection[] = [];

    for (const asset of assets) {
      const file: PickedFile = {
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      };

      if (tokens.length > 0 && !matchesAccept(file, tokens)) {
        rejected.push({ file, reason: "tipo não aceito" });
      } else if (maxSize !== undefined && file.size !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: `maior que ${fileSize(maxSize)}` });
      } else {
        // Tamanho que o aparelho não informou passa: recusar o que não se
        // conseguiu medir barraria um arquivo bom por falta de dado nosso.
        accepted.push(file);
      }
    }

    const kept = multiple ? accepted : accepted.slice(0, 1);
    if (kept.length > 0) onSelect?.(kept);
    if (rejected.length > 0) onReject?.(rejected);
  }

  async function open() {
    if (disabled) return;

    let result;
    try {
      result = await getDocumentAsync({
        type: mimes.length > 0 ? mimes : undefined,
        multiple,
        // O padrão do Expo, escrito à mão porque é uma decisão e não um acaso:
        // o app recebe o `uri` para subir o conteúdo, e sem a cópia no cache
        // metade dos endereços do Android não abre depois que o seletor fecha.
        copyToCacheDirectory: true,
      });
    } catch {
      /*
       * O seletor recusar abrir vale como não ter escolhido nada.
       *
       * As duas formas de ele rejeitar - um segundo toque enquanto o primeiro
       * diálogo ainda está no ar, no Android, e a activity morrer por baixo -
       * terminam no mesmo lugar que o `canceled`: nenhum arquivo. E sem este
       * `catch` a promessa morreria solta, porque o `onPress` do `Pressable`
       * não espera o retorno de ninguém - uma rejeição não tratada por um
       * toque duplo.
       */
      return;
    }

    if (result.canceled) return;
    deliver(result.assets);
  }

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        // O `hint` entra no nome pela mesma razão do web, onde ele mora dentro
        // do `<button>`: quem ouve a tela decide antes de abrir o seletor.
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={open}
        className={cn(
          "h-12 flex-row items-center justify-center gap-2 rounded-md",
          "border border-border-strong bg-surface px-4 active:bg-surface-raised",
          disabled && "opacity-50",
        )}
      >
        <UploadIcon />
        <Text className="text-base font-medium text-fg">{label}</Text>
      </Pressable>

      {hint && (
        <Text
          // Já foi dito no nome do botão; lido duas vezes vira ruído.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="mt-1.5 text-xs text-fg-subtle"
        >
          {hint}
        </Text>
      )}
    </View>
  );
}

export type FileUploadListProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A lista do que já entrou.
 *
 * É uma `View` com espaçamento, e não uma `FlatList`: quem anexa anexa
 * poucos, e virtualizar meia dúzia de linhas custa mais do que rende — além
 * de a lista quase sempre morar dentro de um `ScrollView` de formulário, onde
 * uma lista rolável aninhada é o defeito clássico.
 */
export function FileUploadList({ children, className }: FileUploadListProps) {
  return <View className={cn("mt-3 gap-2", className)}>{children}</View>;
}

export type FileUploadItemProps = {
  name: string;
  /** Em bytes. A formatação ("48,2 KB") é da peça. */
  size: number;
  /** 0 a 100 vira barra. Omitido, o arquivo está pronto. */
  progress?: number;
  /** Vence o progresso: mostra o texto e oferece nova tentativa. */
  error?: string;
  onRetry?: () => void;
  onRemove: () => void;
  className?: string;
};

/** O xis do remover, com duas barras giradas. */
function CloseIcon() {
  return (
    <View className="h-4 w-4 items-center justify-center">
      <View className="absolute h-0.5 w-3.5 rotate-45 rounded-pill bg-fg-muted" />
      <View className="absolute h-0.5 w-3.5 -rotate-45 rounded-pill bg-fg-muted" />
    </View>
  );
}

/**
 * Um arquivo na lista, com o estado que o app informar.
 *
 * O `error` vence o `progress`, como no web — uma barra andando embaixo de uma
 * mensagem de falha diz duas coisas contrárias ao mesmo tempo.
 */
export function FileUploadItem({
  name,
  size,
  progress,
  error,
  onRetry,
  onRemove,
  className,
}: FileUploadItemProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5",
        className,
      )}
    >
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-baseline justify-between gap-3">
          {/* Nome de arquivo é o caso clássico do corte: chega do aparelho e
              pode ter setenta caracteres. O corte é `numberOfLines`, que no RN
              é prop e não classe - e o texto inteiro continua no nó, então o
              leitor de tela lê o nome completo. */}
          <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-fg">
            {name}
          </Text>
          <Text style={{ fontFamily: mono }} className="text-xs text-fg-subtle">
            {fileSize(size)}
          </Text>
        </View>

        {error === undefined && progress !== undefined && (
          <Progress value={progress} label={`Enviando ${name}`} />
        )}

        {error !== undefined && (
          <View className="flex-row items-center gap-2">
            <Text className="min-w-0 flex-1 text-xs text-danger-text">{error}</Text>
            {onRetry && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tentar enviar ${name} de novo`}
                onPress={onRetry}
                hitSlop={8}
              >
                <Text className="text-xs font-medium text-fg-muted">Tentar de novo</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remover ${name}`}
        onPress={onRemove}
        // O xis desenha 16px; o hitSlop leva o alvo aos 44 sem alargar a linha.
        hitSlop={14}
      >
        <CloseIcon />
      </Pressable>
    </View>
  );
}
