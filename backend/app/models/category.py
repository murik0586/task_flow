
#
# class Category(Base):
#     __tablename__ = "categories"
#
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String(100), unique=True, nullable=False, index=True)
#
#     tasks = relationship("Task", back_populates="category")
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    tasks = relationship("Task", back_populates="category")
    owner = relationship("User", back_populates="categories")