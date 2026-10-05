import { Avatar, LinkButton } from "@/src/presentation/ui";
import type { FamilyFeedFilter } from "@/src/domain/family/feed";
import type { FamilyFeedOption } from "@/src/presentation/family";
import styles from "./family-feed-filters.module.css";

const kidAvatarTones = ["blue", "pink", "green", "yellow", "purple", "coral"] as const;

/** Configuration received by the family feed filter navigation. */
type FamilyFeedFiltersProps = {
  /** Optional classes applied to the filter navigation. */
  className?: string;
  /** Filter options authorized for the current parent. */
  options: readonly FamilyFeedOption[];
  /** Filter currently applied to the feed. */
  selectedFilter: FamilyFeedFilter;
};

/**
 * Checks whether a feed filter matches the current selection.
 *
 * @param filter - Candidate filter option.
 * @param selectedFilter - Filter currently applied to the feed.
 * @returns Whether the candidate filter is active.
 */
function isSelected(
  filter: FamilyFeedFilter,
  selectedFilter: FamilyFeedFilter,
): boolean {
  if (filter.kind !== selectedFilter.kind) {
    return false;
  }

  if (filter.kind === "all" || selectedFilter.kind === "all") {
    return filter.kind === "all" && selectedFilter.kind === "all";
  }

  return filter.id === selectedFilter.id;
}

/**
 * Builds the canonical Family Feed URL for a filter option.
 *
 * @param filter - Filter option whose destination should be generated.
 * @returns The Family Feed URL containing the filter parameters.
 */
function getFilterHref(filter: FamilyFeedFilter): string {
  if (filter.kind === "all") {
    return "/family-feed?filter=all";
  }

  return `/family-feed?filter=${filter.kind}&id=${encodeURIComponent(filter.id)}`;
}

/**
 * Renders server-authorized child, room, and all-room feed filters.
 *
 * @param props - Filter options and current selection.
 * @param props.className - Optional classes applied to the filter navigation.
 * @param props.options - Filter options authorized for the current parent.
 * @param props.selectedFilter - Filter currently applied to the feed.
 * @returns The family feed filter navigation.
 */
export function FamilyFeedFilters({
  className = "",
  options,
  selectedFilter,
}: FamilyFeedFiltersProps) {
  return (
    <nav
      aria-label="Filtrar publicaciones"
      className={`${styles.navigation} ${className}`}
    >
      {options.map((option, index) => {
        const active = isSelected(option.filter, selectedFilter);

        return (
          <LinkButton
            aria-current={active ? "page" : undefined}
            className={`${styles.filter} ${active ? styles.active : ""}`}
            href={getFilterHref(option.filter)}
            key={`${option.filter.kind}-${option.id}`}
            variant="ghost"
          >
            {option.filter.kind === "kid" ? (
              <Avatar
                aria-hidden="true"
                initial={option.label.trim().charAt(0).toUpperCase()}
                size="sm"
                tone={kidAvatarTones[index % kidAvatarTones.length]}
              />
            ) : null}
            {option.label}
          </LinkButton>
        );
      })}
    </nav>
  );
}
