import React from "react";
import { XStack } from "tamagui";
import { AttendanceStatus as AttendanceStatusEnum } from "@/database/models/AttendanceRecord";
import { MiniStat } from "@/modules/core/components";
import { STATUS_CONFIG } from "../constants";

interface AttendanceStatsProps {
  total?: number;
  present: number;
  absent: number;
  excused: number;
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({
  total,
  present,
  absent,
  excused,
}) => {
  const presentConfig = STATUS_CONFIG[AttendanceStatusEnum.PRESENT];
  const absentConfig = STATUS_CONFIG[AttendanceStatusEnum.ABSENT];
  const excusedConfig = STATUS_CONFIG[AttendanceStatusEnum.EXCUSED];

  const actualTotal = total ?? present + absent + excused;
  const attendanceRate =
    actualTotal > 0 ? Math.round((present / actualTotal) * 100) : 0;

  return (
    <XStack justifyContent="space-between" alignItems="center" padding="$3">
      <MiniStat
        value={`${attendanceRate}%`}
        color="$jadeGreen"
        label={t("attendanceRate")}
      />

      <XStack gap="$5">
        <MiniStat
          icon={presentConfig.icon}
          value={present}
          color={presentConfig.color}
          label={t("attendanceStatsPresent")}
        />
        <MiniStat
          icon={absentConfig.icon}
          value={absent}
          color={absentConfig.color}
          label={t("attendanceStatsAbsent")}
        />
        <MiniStat
          icon={excusedConfig.icon}
          value={excused}
          color={excusedConfig.color}
          label={t("attendanceStatsExcused")}
        />
      </XStack>
    </XStack>
  );
};
