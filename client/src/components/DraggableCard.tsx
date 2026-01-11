import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface DraggableCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

export function DraggableCard({ id, title, children, isDragging }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isSortableDragging ? "opacity-50" : ""}`}
    >
      <Card className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 cursor-grab active:cursor-grabbing p-2 hover:bg-accent rounded-lg transition-colors"
          title="Arrastra para reordenar"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <CardHeader className="pl-12">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="pl-12">{children}</CardContent>
      </Card>
    </div>
  );
}
