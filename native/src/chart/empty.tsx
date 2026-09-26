import { View } from "react-native";

import { cn } from "../cn";
import { EmptyState } from "../empty-state";
import type { ChartContainerProps } from "./chart";

export type ChartEmptyContent = NonNullable<ChartContainerProps["empty"]>;

export function ChartEmpty({
  empty,
  className,
}: {
  empty: ChartEmptyContent;
  className?: string;
}) {
  return (
    <View className={cn("w-full items-center justify-center", className)}>
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
        icon={empty.icon}
      />
    </View>
  );
}
