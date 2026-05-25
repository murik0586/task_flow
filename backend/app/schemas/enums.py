from enum import Enum


class TaskStatus(str, Enum):
    OPEN = "open"
    WORK = "work"
    WAITING = "waiting"
    CLOSE = "close"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ThemePreference(str, Enum):
    LIGHT = "light"
    DARK = "dark"
