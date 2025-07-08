#!/usr/bin/env python3
"""
测试运行脚本
"""
import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """运行命令并打印结果"""
    print(f"\n{'='*50}")
    print(f"运行: {description}")
    print(f"命令: {cmd}")
    print(f"{'='*50}")
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print("标准输出:")
        print(result.stdout)
    
    if result.stderr:
        print("错误输出:")
        print(result.stderr)
    
    return result.returncode == 0

def check_dependencies():
    """检查必要的依赖项"""
    print("检查依赖项...")
    
    required_packages = [
        'pytest',
        'pytest-asyncio', 
        'pytest-cov',
        'httpx',
        'aiosqlite'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package} 已安装")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} 未安装")
    
    if missing_packages:
        print(f"\n缺少依赖项: {', '.join(missing_packages)}")
        print("请运行以下命令安装:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def main():
    """主函数"""
    print("Huddle Up 后端测试运行器")
    print("=" * 50)
    
    # 检查当前目录
    if not Path("app").exists():
        print("错误: 请在项目根目录运行此脚本")
        sys.exit(1)
    
    # 检查依赖项
    if not check_dependencies():
        sys.exit(1)
    
    # 设置环境变量
    os.environ['PYTHONPATH'] = os.getcwd()
    
    # 运行测试选项
    test_options = {
        '1': ('pytest app/tests/ -v', '运行所有测试'),
        '2': ('pytest app/tests/ -v --cov=app --cov-report=html', '运行测试并生成HTML覆盖率报告'),
        '3': ('pytest app/tests/ -v --cov=app --cov-report=term-missing', '运行测试并显示覆盖率'),
        '4': ('pytest app/tests/test_auth.py -v', '只运行认证测试'),
        '5': ('pytest app/tests/test_user_service.py -v', '只运行用户服务测试'),
        '6': ('pytest app/tests/test_api_auth.py -v', '只运行认证API测试'),
        '7': ('pytest app/tests/test_api_users.py -v', '只运行用户API测试'),
        '8': ('pytest app/tests/test_models.py -v', '只运行模型测试'),
        '9': ('pytest app/tests/test_config.py -v', '只运行配置测试'),
        '10': ('pytest app/tests/ -v -x', '运行测试，遇到失败立即停止'),
        '11': ('pytest app/tests/ -v --tb=long', '运行测试，显示详细错误信息'),
    }
    
    if len(sys.argv) > 1:
        # 命令行参数模式
        option = sys.argv[1]
        if option in test_options:
            cmd, description = test_options[option]
            success = run_command(cmd, description)
            sys.exit(0 if success else 1)
        else:
            print(f"无效选项: {option}")
            print("可用选项:", ', '.join(test_options.keys()))
            sys.exit(1)
    else:
        # 交互模式
        print("\n请选择测试选项:")
        for key, (cmd, description) in test_options.items():
            print(f"{key}. {description}")
        
        while True:
            choice = input("\n请输入选项 (1-11) 或 'q' 退出: ").strip()
            
            if choice.lower() == 'q':
                print("退出测试运行器")
                break
            
            if choice in test_options:
                cmd, description = test_options[choice]
                success = run_command(cmd, description)
                
                if success:
                    print(f"\n✓ {description} 成功完成")
                else:
                    print(f"\n✗ {description} 失败")
                
                # 询问是否继续
                continue_choice = input("\n是否继续运行其他测试? (y/n): ").strip().lower()
                if continue_choice != 'y':
                    break
            else:
                print("无效选项，请重新输入")

if __name__ == "__main__":
    main() 