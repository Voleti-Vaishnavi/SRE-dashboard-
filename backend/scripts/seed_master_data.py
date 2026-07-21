"""Seed the 4 teams and their applications (master/reference data).

Medal Category values below are MOCK PLACEHOLDERS for demo purposes only
(loosely themed so criticality feels plausible) and must be replaced with
the real, authoritative values before go-live.
"""

from app.core.database import Base, SessionLocal, engine
from app.models import Application, Team
from app.utils.enums import TEAMS_AND_APPS, MedalCategory

MOCK_MEDAL_CATEGORY: dict[str, MedalCategory] = {
    "RAIS Internet": MedalCategory.GOLD,
    "CSR browser": MedalCategory.GOLD,
    "TCIS NG": MedalCategory.SILVER,
    "cycle PET": MedalCategory.SILVER,
    "NYCSLB": MedalCategory.BRONZE,
    "STMR": MedalCategory.SILVER,
    "CAMP": MedalCategory.BRONZE,
    "Energy Management Analytics": MedalCategory.GOLD,
    "Random Drug Testing": MedalCategory.TIN,
    "Travel": MedalCategory.TIN,
    "Sick VRU": MedalCategory.BRONZE,
    "Substation dashboard": MedalCategory.GOLD,
    "Elogger": MedalCategory.SILVER,
    "Steam meter calibration": MedalCategory.BRONZE,
}


def seed_master_data() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for team_name, app_names in TEAMS_AND_APPS.items():
            team = db.query(Team).filter_by(name=team_name).one_or_none()
            if team is None:
                team = Team(name=team_name)
                db.add(team)
                db.flush()

            for app_name in app_names:
                app = db.query(Application).filter_by(name=app_name).one_or_none()
                medal = MOCK_MEDAL_CATEGORY[app_name].value
                if app is None:
                    db.add(
                        Application(
                            name=app_name,
                            team_id=team.id,
                            medal_category=medal,
                        )
                    )
                else:
                    app.team_id = team.id
                    app.medal_category = medal

        db.commit()
        total_teams = db.query(Team).count()
        total_apps = db.query(Application).count()
        print(f"Seeded {total_teams} teams and {total_apps} applications.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_master_data()
