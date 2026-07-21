from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ChangeDeployment(Base):
    __tablename__ = "change_deployments"

    id: Mapped[int] = mapped_column(primary_key=True)
    cr_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), nullable=False)
    tower_name: Mapped[str] = mapped_column(String(100), nullable=False)
    assignment_group: Mapped[str] = mapped_column(String(150), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str] = mapped_column(String(150), nullable=True)
    change_status: Mapped[str] = mapped_column(String(20), nullable=False)
    four_eye_status: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    application: Mapped["Application"] = relationship()
