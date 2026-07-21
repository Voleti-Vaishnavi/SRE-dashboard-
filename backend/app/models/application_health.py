from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ApplicationHealth(Base):
    __tablename__ = "application_health"
    __table_args__ = (UniqueConstraint("application_id", "date", name="uq_health_app_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    url_failing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    job_failing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    interface_failing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    critical_file_failing: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    categories_evaluated: Mapped[int] = mapped_column(Integer, nullable=False)
    categories_failing: Mapped[int] = mapped_column(Integer, nullable=False)
    health_status: Mapped[str] = mapped_column(String(20), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    application: Mapped["Application"] = relationship()
