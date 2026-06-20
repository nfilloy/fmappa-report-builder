import { memo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scope3Hotspots } from "@/components/report-builder/charts/Scope3Hotspots";

export const TopCategories = memo(function TopCategories({
  categories,
  title = "Top categories",
  emptyText = "No recognised category columns were found in this CSV.",
  unit,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">{emptyText}</p>
        ) : (
          <Scope3Hotspots categories={categories} unit={unit} />
        )}
      </CardContent>
    </Card>
  );
});
