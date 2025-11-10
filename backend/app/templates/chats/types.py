from enum import Enum


class Role(Enum):
    """ Enum for the 3 possible roles. """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
