from typing import Tuple
from sqlalchemy.orm import Query
from fastapi import HTTPException


def apply_pagination(
    query: Query,
    skip: int = 0,
    limit: int = 10,
    max_limit: int = 100
) -> Tuple[int, list]:
    """
    Применяет пагинацию к SQLAlchemy-запросу.
    Возвращает (total_count, items).
    """
    if limit > max_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Лимит записей не может превышать {max_limit}"
        )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return total, items
