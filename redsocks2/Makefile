#
# Copyright (C) 2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=redsocks2
PKG_VERSION:=20170730
PKG_RELEASE:=4
PKG_REV:=3052eeab75ff1ebd20c22334fbbecd808525bca7
PKG_BUILD_DEPENDS:=libevent2

PKG_SOURCE_PROTO:=git
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.bz2
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_URL:=https://github.com/semigodking/redsocks.git
PKG_SOURCE_VERSION:=$(PKG_REV)

include $(INCLUDE_DIR)/package.mk

define Package/redsocks2
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  DEPENDS:=+libevent2 +libevent2-openssl +libopenssl +libopenssl-legacy
  TITLE:=Redsocks2 TCP 透明代理核心
endef

define Package/redsocks2/description
  启用 HTTPS CONNECT（TLS）代理支持的 Redsocks2 核心程序。
  本软件包仅提供 TCP 透明代理，不支持 UDP。
endef

MAKE_FLAGS += ENABLE_HTTPS_PROXY=true \
	CFLAGS="$(TARGET_CFLAGS) -I$(STAGING_DIR)/usr/include" \
	LDFLAGS="$(TARGET_LDFLAGS) -L$(STAGING_DIR)/usr/lib"

define Package/redsocks2/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/redsocks2 $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,redsocks2))
