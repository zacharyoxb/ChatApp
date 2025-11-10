""" All non-request/response types related to chats"""
from enum import Enum

# we probably wanna move this at some point as it
# probably will be used for requests/responses


class Role(Enum):
    """ Enum for the 3 possible roles. """
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
