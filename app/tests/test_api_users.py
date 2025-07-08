"""
用户API测试
"""
import pytest

class TestUsersAPI:
    """用户API测试"""
    
    @pytest.mark.asyncio
    async def test_get_users_success(self, client, test_user, test_user_2, auth_headers):
        """测试获取用户列表成功"""
        response = await client.get("/api/v1/users", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 2
        usernames = [user["username"] for user in data]
        assert "testuser" in usernames
        assert "testuser2" in usernames
    
    @pytest.mark.asyncio
    async def test_get_users_with_pagination(self, client, test_user, test_user_2, auth_headers):
        """测试获取用户列表分页"""
        response = await client.get("/api/v1/users?skip=0&limit=1", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        
        response = await client.get("/api/v1/users?skip=1&limit=1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
    
    @pytest.mark.asyncio
    async def test_get_users_without_auth(self, client, test_user):
        """测试获取用户列表失败 - 无认证"""
        response = await client.get("/api/v1/users")
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, client, test_user, auth_headers):
        """测试根据ID获取用户成功"""
        response = await client.get(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, client, auth_headers):
        """测试根据ID获取用户失败 - 用户不存在"""
        response = await client.get("/api/v1/users/999", headers=auth_headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_update_user_success(self, client, test_user, auth_headers, sample_user_update_data):
        """测试更新用户成功"""
        response = await client.put(
            f"/api/v1/users/{test_user.id}", 
            json=sample_user_update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["full_name"] == sample_user_update_data["full_name"]
        assert data["bio"] == sample_user_update_data["bio"]
        assert data["timezone"] == sample_user_update_data["timezone"]
        # 其他字段应该保持不变
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
    
    @pytest.mark.asyncio
    async def test_update_user_not_found(self, client, auth_headers, sample_user_update_data):
        """测试更新用户失败 - 用户不存在"""
        response = await client.put(
            "/api/v1/users/999",
            json=sample_user_update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_delete_user_success(self, client, test_user, auth_headers):
        """测试删除用户成功"""
        response = await client.delete(f"/api/v1/users/{test_user.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User deleted successfully"
    
    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, client, auth_headers):
        """测试删除用户失败 - 用户不存在"""
        response = await client.delete("/api/v1/users/999", headers=auth_headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_search_users_success(self, client, test_user, test_user_2, auth_headers):
        """测试搜索用户成功"""
        response = await client.get("/api/v1/users/search?q=testuser", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 2
        usernames = [user["username"] for user in data]
        assert "testuser" in usernames
        assert "testuser2" in usernames
    
    @pytest.mark.asyncio
    async def test_search_users_with_limit(self, client, test_user, test_user_2, auth_headers):
        """测试搜索用户带限制"""
        response = await client.get("/api/v1/users/search?q=testuser&limit=1", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
    
    @pytest.mark.asyncio
    async def test_search_users_no_results(self, client, test_user, auth_headers):
        """测试搜索用户无结果"""
        response = await client.get("/api/v1/users/search?q=nonexistent", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
    
    @pytest.mark.asyncio
    async def test_search_users_missing_query(self, client, auth_headers):
        """测试搜索用户缺少查询参数"""
        response = await client.get("/api/v1/users/search", headers=auth_headers)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data 