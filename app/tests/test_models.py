"""
数据库模型测试
"""
import pytest
from datetime import datetime
from sqlalchemy import select

from app.models.user import User
from app.models.team import Team
from app.models.channel import Channel
from app.models.message import Message
from app.models.team_member import TeamMember
from app.models.channel_member import ChannelMember
from app.models.notification import Notification


class TestUserModel:
    """用户模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_user(self, test_db):
        """测试创建用户"""
        user = User(
            username="modeluser",
            email="model@example.com",
            full_name="Model User",
            hashed_password="hashed_password",
            bio="Model test bio",
            timezone="UTC"
        )
        
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        assert user.id is not None
        assert user.username == "modeluser"
        assert user.email == "model@example.com"
        assert user.full_name == "Model User"
        assert user.bio == "Model test bio"
        assert user.timezone == "UTC"
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_online is False
        assert user.created_at is not None
        assert user.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_user_repr(self, test_db):
        """测试用户字符串表示"""
        user = User(
            username="repruser",
            email="repr@example.com",
            full_name="Repr User",
            hashed_password="hashed_password"
        )
        
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        repr_str = repr(user)
        assert "User" in repr_str
        assert "repruser" in repr_str
        assert "repr@example.com" in repr_str
    
    @pytest.mark.asyncio
    async def test_user_unique_constraints(self, test_db):
        """测试用户唯一性约束"""
        user1 = User(
            username="unique",
            email="unique@example.com",
            full_name="Unique User",
            hashed_password="hashed_password"
        )
        
        test_db.add(user1)
        await test_db.commit()
        
        # 尝试创建相同用户名的用户
        user2 = User(
            username="unique",
            email="different@example.com",
            full_name="Different User",
            hashed_password="hashed_password"
        )
        
        test_db.add(user2)
        
        with pytest.raises(Exception):  # 应该抛出唯一性约束异常
            await test_db.commit()
    
    @pytest.mark.asyncio
    async def test_user_optional_fields(self, test_db):
        """测试用户可选字段"""
        user = User(
            username="minimal",
            email="minimal@example.com",
            full_name="Minimal User",
            hashed_password="hashed_password"
        )
        
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        assert user.bio is None
        assert user.timezone is None
        assert user.avatar_url is None
        assert user.last_seen is None


class TestTeamModel:
    """团队模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_team(self, test_db, test_user):
        """测试创建团队"""
        team = Team(
            name="Test Team",
            description="Test team description",
            is_private=False,
            owner_id=test_user.id
        )
        
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        assert team.id is not None
        assert team.name == "Test Team"
        assert team.description == "Test team description"
        assert team.is_private is False
        assert team.owner_id == test_user.id
        assert team.created_at is not None
        assert team.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_team_owner_relationship(self, test_db, test_user):
        """测试团队与所有者的关系"""
        team = Team(
            name="Owner Team",
            description="Owner team description",
            is_private=False,
            owner_id=test_user.id
        )
        
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        # 查询团队的所有者
        stmt = select(Team).where(Team.id == team.id)
        result = await test_db.execute(stmt)
        queried_team = result.scalar_one()
        
        assert queried_team.owner_id == test_user.id


class TestChannelModel:
    """频道模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_channel(self, test_db, test_user):
        """测试创建频道"""
        # 先创建团队
        team = Team(
            name="Test Team",
            description="Test team description",
            is_private=False,
            owner_id=test_user.id
        )
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        # 创建频道
        channel = Channel(
            name="general",
            description="General channel",
            is_private=False,
            team_id=team.id
        )
        
        test_db.add(channel)
        await test_db.commit()
        await test_db.refresh(channel)
        
        assert channel.id is not None
        assert channel.name == "general"
        assert channel.description == "General channel"
        assert channel.is_private is False
        assert channel.team_id == team.id
        assert channel.created_at is not None
        assert channel.updated_at is not None


class TestMessageModel:
    """消息模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_message(self, test_db, test_user):
        """测试创建消息"""
        # 先创建团队和频道
        team = Team(
            name="Test Team",
            description="Test team description",
            is_private=False,
            owner_id=test_user.id
        )
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        channel = Channel(
            name="general",
            description="General channel",
            is_private=False,
            team_id=team.id
        )
        test_db.add(channel)
        await test_db.commit()
        await test_db.refresh(channel)
        
        # 创建消息
        message = Message(
            content="Hello, world!",
            message_type="text",
            author_id=test_user.id,
            channel_id=channel.id
        )
        
        test_db.add(message)
        await test_db.commit()
        await test_db.refresh(message)
        
        assert message.id is not None
        assert message.content == "Hello, world!"
        assert message.message_type == "text"
        assert message.author_id == test_user.id
        assert message.channel_id == channel.id
        assert message.created_at is not None
        assert message.updated_at is not None


class TestNotificationModel:
    """通知模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_notification(self, test_db, test_user):
        """测试创建通知"""
        notification = Notification(
            title="Test Notification",
            message="This is a test notification",
            notification_type="info",
            user_id=test_user.id
        )
        
        test_db.add(notification)
        await test_db.commit()
        await test_db.refresh(notification)
        
        assert notification.id is not None
        assert notification.title == "Test Notification"
        assert notification.message == "This is a test notification"
        assert notification.notification_type == "info"
        assert notification.user_id == test_user.id
        assert notification.is_read is False
        assert notification.created_at is not None


class TestRelationships:
    """关系测试"""
    
    @pytest.mark.asyncio
    async def test_user_team_membership(self, test_db, test_user, test_user_2):
        """测试用户团队成员关系"""
        # 创建团队
        team = Team(
            name="Relationship Team",
            description="Test relationships",
            is_private=False,
            owner_id=test_user.id
        )
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        # 创建团队成员关系
        member1 = TeamMember(
            user_id=test_user.id,
            team_id=team.id,
            role="owner"
        )
        member2 = TeamMember(
            user_id=test_user_2.id,
            team_id=team.id,
            role="member"
        )
        
        test_db.add(member1)
        test_db.add(member2)
        await test_db.commit()
        
        # 验证关系
        stmt = select(TeamMember).where(TeamMember.team_id == team.id)
        result = await test_db.execute(stmt)
        members = result.scalars().all()
        
        assert len(members) == 2
        user_ids = [member.user_id for member in members]
        assert test_user.id in user_ids
        assert test_user_2.id in user_ids
    
    @pytest.mark.asyncio
    async def test_user_channel_membership(self, test_db, test_user, test_user_2):
        """测试用户频道成员关系"""
        # 创建团队和频道
        team = Team(
            name="Channel Team",
            description="Test channel relationships",
            is_private=False,
            owner_id=test_user.id
        )
        test_db.add(team)
        await test_db.commit()
        await test_db.refresh(team)
        
        channel = Channel(
            name="test-channel",
            description="Test channel",
            is_private=False,
            team_id=team.id
        )
        test_db.add(channel)
        await test_db.commit()
        await test_db.refresh(channel)
        
        # 创建频道成员关系
        member1 = ChannelMember(
            user_id=test_user.id,
            channel_id=channel.id,
            role="admin"
        )
        member2 = ChannelMember(
            user_id=test_user_2.id,
            channel_id=channel.id,
            role="member"
        )
        
        test_db.add(member1)
        test_db.add(member2)
        await test_db.commit()
        
        # 验证关系
        stmt = select(ChannelMember).where(ChannelMember.channel_id == channel.id)
        result = await test_db.execute(stmt)
        members = result.scalars().all()
        
        assert len(members) == 2
        user_ids = [member.user_id for member in members]
        assert test_user.id in user_ids
        assert test_user_2.id in user_ids 