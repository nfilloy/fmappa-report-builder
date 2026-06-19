import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scope3Hotspots } from "@/components/report-builder/charts/Scope3Hotspots";

export function TopCategories({ categories }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Scope 3 categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No recognised Scope 3 category columns were found in this CSV.
          </p>
        ) : (
          <Scope3Hotspots categories={categories} />
        )}
      </CardContent>
    </Card>
  );
}
