from collections import defaultdict
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class RegionCodes(str, Enum):
    Auckland = "NZ-AUK"
    BayOfPlenty = "NZ-BOP"
    Canterbury = "NZ-CAN"
    ChathamIslandsTerritory = "NZ-CIT"
    Gisborne = "NZ-GIS"
    GreaterWellington = "NZ-WGN"
    HawkesBay = "NZ-HKB"
    Manawatu_Whanganui = "NZ-MWT"
    Marlborough = "NZ-MBH"
    Nelson = "NZ-NSN"
    Northland = "NZ-NTL"
    Otago = "NZ-OTA"
    Southland = "NZ-STL"
    Taranaki = "NZ-TKI"
    Tasman = "NZ-TAS"
    Waikato = "NZ-WKO"
    WestCoast = "NZ-WTC"


class Settings(BaseSettings):
    MONGODB_CONNECTION_STRING: str
    MONGODB_NAME: str
    MONGODB_TEST_NAME: str

    model_config = SettingsConfigDict(env_file=".env.local")


PyObjectId = Annotated[str, BeforeValidator(str)]


class UserVotes(BaseModel):
    upvotes: set[str]


class Session(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    code: str
    location: RegionCodes
    date_time: str = Field(
        default_factory=lambda: datetime.now()
        .astimezone()
        .strftime("%m/%d/%Y, %H:%M:%S")
    )  # NZST
    user_votes: defaultdict[str, list] = Field(
        default_factory=lambda: defaultdict(list)
    )

    model_config = ConfigDict(populate_by_name=True)


class Venue(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    region: RegionCodes
    hour_open: int = Field(ge=0, le=24)  # Rudimentary times
    hour_closed: int = Field(ge=0, le=24)

    model_config = ConfigDict(populate_by_name=True)


class VenueFilters(BaseModel):
    n: int = 10
    exclude_ids: list[str] = []
    include_ids: list[str] = []


settings = Settings()
