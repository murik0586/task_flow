from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
        category_in: CategoryCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    existing = db.query(Category).filter(
        Category.name == category_in.name,
        Category.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    category = Category(name=category_in.name, user_id=current_user.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/", response_model=List[CategoryOut])
def get_categories(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
        search: Optional[str] = Query(None),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    query = db.query(Category).filter(Category.user_id == current_user.id)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    return query.order_by(Category.name.asc()).offset(skip).limit(limit).all()


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(
        category_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
        category_id: int,
        category_in: CategoryCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing = db.query(Category).filter(
        Category.name == category_in.name,
        Category.user_id == current_user.id,
        Category.id != category_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    category.name = category_in.name
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
        category_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)