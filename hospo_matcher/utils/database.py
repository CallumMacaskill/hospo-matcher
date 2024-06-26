from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from hospo_matcher.utils.data_models import settings
from hospo_matcher.utils.logger import log


class Driver:
    def __init__(self):
        self._mongo_client = None
        self._db_client = None

    @property
    def mongo_client(self) -> AsyncIOMotorClient:
        if self._mongo_client is None:
            self._mongo_client = AsyncIOMotorClient(settings.MONGODB_CONNECTION_STRING)
            log.debug("Set MongoDB client.")
        return self._mongo_client

    def get_db_client(self, db_name: str = settings.MONGODB_NAME) -> AsyncIOMotorDatabase:
        if self._db_client is None:
            self._db_client = self.mongo_client[db_name]
            log.debug("Set database client.")
        return self._db_client


driver = Driver()
