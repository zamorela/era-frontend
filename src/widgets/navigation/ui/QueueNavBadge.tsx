import { Link, useLocation } from "@/shared/routing"
import { ListVideo } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useQueue } from "@/features/generation-queue"

interface QueueNavBadgeProps {
  collapsed: boolean
  onNavigate: () => void
}

export function QueueNavBadge({ collapsed, onNavigate }: QueueNavBadgeProps) {
  const location = useLocation()
  const { activeCount } = useQueue()
  const isActive = location.pathname === "/queue"

  return (
    <Link
      to="/queue"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-full text-sm font-medium transition-colors duration-200",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-accent text-accent-foreground border border-primary/40"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <ListVideo className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">Очередь</span>}
      {activeCount > 0 && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full font-mono font-bold text-white shrink-0",
            collapsed ? "h-4 w-4 text-[9px]" : "h-4 min-w-4 px-1 text-[10px]"
          )}
          style={{ background: "#E85420" }}
          aria-label={`${activeCount} активных генераций`}
        >
          {activeCount > 9 ? "9+" : activeCount}
        </span>
      )}
    </Link>
  )
}
