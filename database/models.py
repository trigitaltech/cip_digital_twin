from datetime import datetime
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class CIPCircuit(Base):
    __tablename__ = "cip_circuits"
    
    circuit_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    plant_location: Mapped[Optional[str]] = mapped_column(String(100))
    num_tanks: Mapped[int] = mapped_column(Integer, default=6)
    tank_volume_m3: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    telemetries: Mapped[List["CircuitTelemetry"]] = relationship(
        back_populates="circuit", cascade="all, delete-orphan"
    )

class CircuitTelemetry(Base):
    __tablename__ = "circuit_telemetry"
    
    telemetry_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    circuit_id: Mapped[str] = mapped_column(String(50), ForeignKey("cip_circuits.circuit_id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    
    slurry_flow_rate_m3_h: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    slurry_density_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    slurry_ph: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    carbon_advance_rate_tons_h: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    
    circuit: Mapped["CIPCircuit"] = relationship(back_populates="telemetries")
    tank_stages: Mapped[List["TankStageMetric"]] = relationship(
        back_populates="telemetry", cascade="all, delete-orphan"
    )
    reagents: Mapped[Optional["ReagentMetric"]] = relationship(
        back_populates="telemetry", cascade="all, delete-orphan", uselist=False
    )

class TankStageMetric(Base):
    __tablename__ = "tank_stage_metrics"
    
    sample_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telemetry_id: Mapped[int] = mapped_column(Integer, ForeignKey("circuit_telemetry.telemetry_id", ondelete="CASCADE"))
    tank_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    solution_au_ppm: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    carbon_load_au_gt: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    carbon_density_gl: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fouling_factor_alpha: Mapped[Decimal] = mapped_column(Numeric(4, 3), default=1.000)
    
    telemetry: Mapped["CircuitTelemetry"] = relationship(back_populates="tank_stages")
    
    __table_args__ = (
        UniqueConstraint("telemetry_id", "tank_index", name="unique_tank_per_reading"),
    )

class ReagentMetric(Base):
    __tablename__ = "reagent_metrics"
    
    reagent_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telemetry_id: Mapped[int] = mapped_column(Integer, ForeignKey("circuit_telemetry.telemetry_id", ondelete="CASCADE"), unique=True)
    
    dry_solids_rate_tons_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    water_rate_m3_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    liquid_to_solid_ratio: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    
    lime_addition_kg_t: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    lime_addition_kg_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    lime_daily_tons: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    nacn_consumption_kg_t: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    nacn_consumption_kg_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    nacn_daily_tons: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    h2o2_addition_kg_t: Mapped[Decimal] = mapped_column(Numeric(8, 3))
    h2o2_addition_kg_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    h2o2_daily_tons: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    equivalent_pure_o2_kg_h: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    telemetry: Mapped["CircuitTelemetry"] = relationship(back_populates="reagents")

