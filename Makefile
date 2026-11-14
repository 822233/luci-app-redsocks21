#
# Copyright (C) 2008-2014 The LuCI Team
# Apache License, Version 2.0
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-redsocks2
PKG_VERSION:=1.0.4
PKG_RELEASE:=17

LUCI_TITLE:=Redsocks2 透明代理管理界面
LUCI_DESCRIPTION:=Redsocks2 TCP 透明代理，支持多节点、订阅导入和网页测速
LUCI_DEPENDS:=+redsocks2 +curl

include $(TOPDIR)/feeds/luci/luci.mk

# Preserve user configuration across package upgrades.
define Package/luci-app-redsocks2/conffiles
/etc/config/redsocks2
endef

# call BuildPackage - OpenWrt buildroot signature
