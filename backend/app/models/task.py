# backend/app/models/task.py
from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base

class TaskStatus(str, enum.Enum):
    OPEN = "open"
    WORK = "work"
    WAITING = "waiting"
    CLOSE = "close"
    CANCELLED = "cancelled"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, default="")
    status = Column(Enum(TaskStatus), default=TaskStatus.OPEN, nullable=False, index=True)
    due_date = Column(DateTime, nullable=True) 
    
    # Оценки времени хранятся в секундах (целое число, может быть NULL)
    initial_assessment_seconds = Column(Integer, nullable=True)   # начальная оценка в секундах
    final_assessment_seconds = Column(Integer, nullable=True)     # фактическое время в секундах

    # Связи
    owner = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")