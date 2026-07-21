import enum


class MedalCategory(str, enum.Enum):
    GOLD = "Gold"
    SILVER = "Silver"
    BRONZE = "Bronze"
    TIN = "Tin"


class ChangeStatus(str, enum.Enum):
    SUCCESS = "Success"
    FAILURE = "Failure"
    WIP = "WIP"


class FourEyeStatus(str, enum.Enum):
    COMPLETED = "Completed"
    NOT_COMPLETED = "Not Completed"
    WIP = "WIP"


class UrlStatus(str, enum.Enum):
    OPERATIONAL = "Operational"
    NON_OPERATIONAL = "Non Operational"


class RunStatus(str, enum.Enum):
    """Shared by Job Monitoring, Interface Monitoring, Critical File Monitoring."""

    SUCCESS = "Success"
    FAILURE = "Failure"
    YET_TO_RUN = "Yet to Run"


class HealthStatus(str, enum.Enum):
    GREEN = "Green"
    AMBER = "Amber"
    RED = "Red"
    NO_DATA = "No Data"


TEAMS_AND_APPS: dict[str, list[str]] = {
    "RCIS": ["RAIS Internet", "CSR browser", "TCIS NG"],
    "NON RCIS": ["cycle PET", "NYCSLB", "STMR", "CAMP"],
    "Shared Services": [
        "Energy Management Analytics",
        "Random Drug Testing",
        "Travel",
        "Sick VRU",
    ],
    "WAM ITOT": ["Substation dashboard", "Elogger", "Steam meter calibration"],
}

UploadCategory = enum.Enum(
    "UploadCategory",
    {
        "CHANGE_DEPLOYMENTS": "change-deployments",
        "URL_AVAILABILITY": "url-availability",
        "JOB_MONITORING": "job-monitoring",
        "INTERFACE_MONITORING": "interface-monitoring",
        "CRITICAL_FILE_MONITORING": "critical-file-monitoring",
    },
)
